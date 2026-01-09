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
const status = searchParams.get("status");
const startDate = searchParams.get("startDate");
const endDate = searchParams.get("endDate");


const query = {};

if (search) {
  query.$or = [
    { category_name: { $regex: search, $options: "i" } },
    { category_slug: { $regex: search, $options: "i" } },
  ];
}

if (status) {
  query.status = status;
}

if (startDate && endDate) {
  query.createdAt = {
    $gte: new Date(startDate),
    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
  };
}


    /* ---------------- FETCH CATEGORIES ---------------- */
    const categories = await Category.find(query).lean();

    if (!categories.length) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    /* ---------------- CATEGORY LOOKUP ---------------- */
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = cat;
    });

    const categoryIds = categories.map(c => c._id.toString());

    /* ---------------- CATEGORY ↔ FILTER ---------------- */
    const categoryFilters = await CategoryFilter.find({
      category_id: { $in: categoryIds },
    }).lean();

    const filterIds = categoryFilters.map(cf => cf.filter_id);

    /* ---------------- FILTERS ---------------- */
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

    /* ---------------- PREPARE EXCEL ROWS ---------------- */
    const excelData = [];

    categoryFilters.forEach(cf => {
      const category = categoryMap[cf.category_id];
      const filter = filterMap[cf.filter_id];

      if (!category || !filter) return;

      const filterGroupName =
        filterGroupMap[filter.filter_group] || "-";

      const parentCategory =
        category.parentid && categoryMap[category.parentid]
          ? categoryMap[category.parentid].category_name
          : "-";

      excelData.push({
        "Category": parentCategory === "-" ? category.category_name : parentCategory,
        "Sub Category": parentCategory === "-" ? "-" : category.category_name,
        "Filter Group": filterGroupName,
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



