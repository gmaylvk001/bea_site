import dbConnect from "@/lib/db";
import Filter from "@/models/ecom_filter_group_infos";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();
    const filtergroup_name = formData.get("filtergroup_name");
    const status = formData.get("status") || "Active";

    if (!filtergroup_name) {
      return NextResponse.json({ error: "filter group name is required" }, { status: 400 });
    }

    let filtergroup_slug = filtergroup_name.toLowerCase().replace(/\s+/g, "-");

    // Check if filter group already exists
    let existingFilter = await Filter.findOne({ filtergroup_slug });
    if (existingFilter) {
      return NextResponse.json({ error: "filter group already exists" }, { status: 400 });
    }

    const newFilter = new Filter({
      filtergroup_name,
      filtergroup_slug,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newFilter.save();
    return NextResponse.json({ message: "filter group added successfully", filtergroup: newFilter }, { status: 201 });

  } catch (error) {
    console.error("Error adding Filter group:", error);
    return NextResponse.json({ error: "Failed to add Filter group", details: error.message }, { status: 500 });
  }
}
