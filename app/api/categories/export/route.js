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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    /* ---------------- CATEGORY QUERY ---------------- */
    const query = {};
    if (search) {
      query.category_name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const categories = await Category.find(query).lean();

    if (!categories.length) {
      return NextResponse.json(
        { success: false, message: "No categories found" },
        { status: 404 }
      );
    }

    /* ---------------- MAP CATEGORY IDS ---------------- */
    const categoryIds = categories.map(c => c._id.toString());

    /* ---------------- FETCH CATEGORY-FILTER MAPPING ---------------- */
    const categoryFilters = await CategoryFilter.find({
      category_id: { $in: categoryIds },
    }).lean();

    const filterIds = categoryFilters.map(cf => cf.filter_id);

    /* ---------------- FETCH FILTERS ---------------- */
    const filters = await Filter.find({
      _id: { $in: filterIds },
    }).lean();

    const filterGroupIds = filters.map(f => f.filter_group);

    /* ---------------- FETCH FILTER GROUPS ---------------- */
    const filterGroups = await FilterGroup.find({
      _id: { $in: filterGroupIds },
    }).lean();

    /* ---------------- CREATE LOOKUP MAPS ---------------- */
    const filterMap = {};
    filters.forEach(f => {
      filterMap[f._id.toString()] = f;
    });

    const filterGroupMap = {};
    filterGroups.forEach(g => {
      filterGroupMap[g._id.toString()] = g.filtergroup_name;
    });

    /* ---------------- GROUP FILTERS BY CATEGORY + GROUP ---------------- */
    const categoryFilterMap = {};

    categoryFilters.forEach(cf => {
      const filter = filterMap[cf.filter_id];
      if (!filter) return;

      const groupName =
        filterGroupMap[filter.filter_group] || "Other";

      if (!categoryFilterMap[cf.category_id]) {
        categoryFilterMap[cf.category_id] = {};
      }

      if (!categoryFilterMap[cf.category_id][groupName]) {
        categoryFilterMap[cf.category_id][groupName] = [];
      }

      categoryFilterMap[cf.category_id][groupName].push(
        filter.filter_name
      );
    });

    /* ---------------- PREPARE EXCEL DATA ---------------- */
    const excelData = categories.map((cat, index) => {
      const groupedFilters = categoryFilterMap[cat._id] || {};

      const filterString = Object.entries(groupedFilters)
        .map(
          ([group, values]) =>
            `${group}: ${values.join(", ")}`
        )
        .join(" | ");

      return {
        "S.No": index + 1,
        "Category Name": cat.category_name,
        "Category Slug": cat.category_slug || "",
        "Status": cat.status,
        "Filters": filterString || "-",
        "Created Date": cat.createdAt
          ? new Date(cat.createdAt).toLocaleDateString()
          : "",
      };
    });

    /* ---------------- CREATE EXCEL ---------------- */
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition":
          "attachment; filename=categories-with-filters.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Category export error:", error);
    return NextResponse.json(
      { success: false, message: "Export failed" },
      { status: 500 }
    );
  }
}
