import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // Ensure this is your MongoDB connection utility
import Blog from "@/models/ecom_blog_info"; // Adjust the path based on your structure

export async function PUT(req) {
    await dbConnect(); // Connect to the database

    try {
        const { searchParams } = new URL(req.url);
        const blogId = searchParams.get('id'); // Extract the blog ID from query parameters

        // Validate the blog ID
        if (!blogId) {
            return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
        }

        // Find the blog to be updated
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        }

        // Update the blog status to "Inactive"
        await Blog.findByIdAndUpdate(blogId, { status: "Inactive" });

        return NextResponse.json(
            { success: true, message: "Blog status updated to Inactive" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating blog status:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}