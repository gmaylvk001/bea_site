import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import JobApplication from "@/models/JobApplication";
import fs from "fs";
import path from "path";

// GET: Fetch job applications with search, status filter, and pagination
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";
    const jobPost = searchParams.get("job_post") || "All";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query = {};

    if (status && status !== "All") {
      query.status = status;
    }

    if (jobPost && jobPost !== "All") {
      query.job_post = jobPost;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { mobile_number: searchRegex },
        { city: searchRegex },
        { job_post: searchRegex },
      ];
    }

    const total = await JobApplication.countDocuments(query);
    const applications = await JobApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get distinct job posts for filter dropdown
    const distinctPosts = await JobApplication.distinct("job_post");

    return NextResponse.json({
      success: true,
      data: applications,
      distinctPosts,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      currentPage: page,
    });
  } catch (error) {
    console.error("Fetch job applications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job applications" },
      { status: 500 }
    );
  }
}

// PUT: Update status or notes of an application
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Application ID is required" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updated = await JobApplication.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update job application error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE: Delete an application
export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {
        // query param was used
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Application ID is required" },
        { status: 400 }
      );
    }

    const app = await JobApplication.findById(id);
    if (!app) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    // Try to remove resume file from disk
    if (app.resume_path) {
      try {
        const fullPath = path.join(process.cwd(), "public", app.resume_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileErr) {
        console.warn("Could not delete resume file:", fileErr.message);
      }
    }

    await JobApplication.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete job application error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete application" },
      { status: 500 }
    );
  }
}
