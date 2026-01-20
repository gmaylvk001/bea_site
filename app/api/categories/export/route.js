import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";

import Category from "@/models/ecom_category_info";
import CategoryFilter from "@/models/ecom_categoryfilters_infos";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";

import * as XLSX from "xlsx";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    /* ---------------- SEARCH QUERY ---------------- */
    const query = {};

    if (search) {
      query.$or = [
        { category_name: { $regex: search, $options: "i" } },
        { category_slug: { $regex: search, $options: "i" } },
      ];
    }

    /* ---------------- FETCH SEARCHED (CHILD) CATEGORIES ---------------- */
    const searchedCategories = await Category.find(query).lean();

    if (!searchedCategories.length) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const searchedCategoryIds = searchedCategories.map(c => c._id.toString());

    /* ---------------- FETCH PARENT FOR DISPLAY ---------------- */
    const categoryMap = {};

    for (const cat of searchedCategories) {
      categoryMap[cat._id.toString()] = cat;

      if (cat.parentid) {
        const parent = await Category.findById(cat.parentid).lean();
        if (parent) {
          categoryMap[parent._id.toString()] = parent;
        }
      }
    }

    /* ---------------- CATEGORY ↔ FILTER (ONLY SEARCHED CATEGORY) ---------------- */
    const categoryFilters = await CategoryFilter.find({
      category_id: { $in: searchedCategoryIds },
    }).lean();

    if (!categoryFilters.length) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    /* ---------------- FILTERS ---------------- */
    const filterIds = categoryFilters.map(cf => cf.filter_id);

    const filters = await Filter.find({
      _id: { $in: filterIds },
    }).lean();

    const filterMap = {};
    filters.forEach(f => {
      filterMap[f._id.toString()] = f;
    });

    /* ---------------- FILTER GROUPS ---------------- */
    const filterGroupIds = filters.map(f => f.filter_group);

    const filterGroups = await FilterGroup.find({
      _id: { $in: filterGroupIds },
    }).lean();

    const filterGroupMap = {};
    filterGroups.forEach(g => {
      filterGroupMap[g._id.toString()] = g.filtergroup_name;
    });

    /* ---------------- CATEGORY DISPLAY LOGIC (SMALL CHANGE) ---------------- */
    const getCategoryNames = (category) => {
      let categoryName = "-";
      let subCategoryName = category.category_name;

      if (category.parentid) {
        const parent = categoryMap[category.parentid];
        categoryName = parent?.category_name || "-";
      }

      return { categoryName, subCategoryName };
    };

    /* ---------------- PREPARE EXCEL DATA ---------------- */
    const excelData = [];

    categoryFilters.forEach(cf => {
      const category = categoryMap[cf.category_id];
      const filter = filterMap[cf.filter_id];

      if (!category || !filter) return;

      const { categoryName, subCategoryName } = getCategoryNames(category);

      excelData.push({
        "Category": categoryName,
        "Sub Category": subCategoryName,
        "Filter Group": filterGroupMap[filter.filter_group] || "-",
        "Filter Value": filter.filter_name,
      });
    });

    /* ---------------- CREATE EXCEL ---------------- */
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Category Filters");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition":
          "attachment; filename=category-filter-export.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, message: "Export failed" },
      { status: 500 }
    );
  }
}
