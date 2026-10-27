import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import "@/models/ecom_category_info";
import BlogComponent from "@/components/blog/blog";
import { buildCanonicalUrl } from "@/components/CanonicalLink";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Blog & Buying Guides | Bharath Electronics & Appliances",
  description:
    "Expert buying guides, appliance comparisons, maintenance tips, and latest technology updates from Bharath Electronics & Appliances.",
  alternates: {
    canonical: buildCanonicalUrl("/blog"),
  },
  openGraph: {
    title: "Blog & Buying Guides | Bharath Electronics & Appliances",
    description:
      "Expert buying guides, appliance comparisons, maintenance tips, and latest technology updates from Bharath Electronics & Appliances.",
    url: "https://www.bharathelectronics.in/blog",
    type: "website",
  },
};

async function getInitialBlogs() {
  try {
    await dbConnect();
    const blogs = await Blog.find({ status: "Active" })
      .populate("category")
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(blogs));
  } catch (error) {
    console.error("Error fetching initial blogs for /blog:", error);
    return [];
  }
}

export default async function BlogPage() {
  const initialBlogs = await getInitialBlogs();

  return (
    <div>
      <BlogComponent initialBlogs={initialBlogs} />
    </div>
  );
}
