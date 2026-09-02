// app/blog/[slug]/page.js
import React from "react";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import "@/models/ecom_category_info";
import {
  getBaseUrl,
  stripHtml,
  sanitizeMetaKeywords,
  buildBlogPostingSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema";
import { buildCanonicalUrl } from "@/components/CanonicalLink";

async function getBlogPost(slug) {
  try {
    await dbConnect();
    const blog = await Blog.findOne({ blog_slug: slug, status: "Active" })
      .populate("category")
      .lean();
    return blog || null;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

async function getOtherBlogs(currentId) {
  try {
    await dbConnect();
    return await Blog.find({
      status: "Active",
      ...(currentId ? { _id: { $ne: currentId } } : {}),
    })
      .select("blog_name blog_slug image createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  } catch (error) {
    console.error("Error fetching other blogs:", error);
    return [];
  }
}

// ── Video embed helper ────────────────────────────────────────────────────────
function getYouTubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function VideoEmbed({ url }) {
  if (!url) return null;

  const ytId = getYouTubeId(url);

  if (ytId) {
    return (
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}`}
          title="BEA Expert Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct hosted video (mp4 etc.)
  return (
    <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
      <video
        className="w-full rounded-xl"
        src={url}
        controls
        playsInline
      />
    </div>
  );
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);
  const baseUrl = getBaseUrl();

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog post not found</h1>
          <p className="text-gray-600 mb-6">The requested blog post could not be found.</p>
          <Link
            href="/blog"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const otherBlogs = await getOtherBlogs(blog._id);
  const hasVideo = blog.video && blog.video.trim() !== "";
  const blogSchema = buildBlogPostingSchema(baseUrl, blog);
  const breadcrumbSchema = buildBreadcrumbSchema(baseUrl, [
    { name: "Blog", path: "/blog" },
    { name: blog.blog_name, path: `/blog/${blog.blog_slug}` },
  ]);

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;1,400&display=swap');
        .blog-article-body { font-family: Roboto, Calibri, Helvetica, Arial, sans-serif; font-size: 16.5px; line-height: 1.8; color: #1f2937; }
        .blog-article-body p { margin-bottom: 1.15rem; }
        .blog-article-body h1 { font-size: 2rem; font-weight: 700; margin: 1.75rem 0 1rem; color: #111827; }
        .blog-article-body h2 { font-size: 1.6rem; font-weight: 700; margin: 1.5rem 0 0.85rem; color: #111827; }
        .blog-article-body h3 { font-size: 1.3rem; font-weight: 600; margin: 1.25rem 0 0.7rem; color: #111827; }
        .blog-article-body h4 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; }
        .blog-article-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 1.15rem; }
        .blog-article-body ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.15rem; }
        .blog-article-body li { margin-bottom: 0.4rem; }
        .blog-article-body a { color: #2563eb; text-decoration: underline; }
        .blog-article-body img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 1.5rem 0; }
        .blog-article-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
        .blog-article-body th, .blog-article-body td { border: 1px solid #e5e7eb; padding: 0.6rem 0.75rem; text-align: left; }
        .blog-article-body iframe, .blog-article-body video { max-width: 100%; margin: 1.5rem 0; }
      `}</style>
      {blogSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium line-clamp-1">{blog.blog_name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 xl:gap-14 items-start">
        <div>

        {/* Category badge */}
        {blog.category?.category_name && (
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
            {blog.category.category_name}
          </span>
        )}

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.blog_name}
          </h1>
          <div className="flex items-center text-gray-500 text-sm gap-3">
            <span>
              Published on{" "}
              {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {hasVideo && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Video included
                </span>
              </>
            )}
          </div>
        </header>

        {/* Featured Image — show only if no video, or show above video */}
        {blog.image && !hasVideo && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={blog.image}
              alt={blog.blog_name}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Video embed — shown first if present */}
        {hasVideo && <VideoEmbed url={blog.video} />}

        {/* If both image and video exist, show image as a thumbnail below video */}
        {blog.image && hasVideo && (
          <div className="mb-8 rounded-lg overflow-hidden shadow border border-gray-100">
            <img
              src={blog.image}
              alt={blog.blog_name}
              className="w-full h-56 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-10 mb-10">
          <div
            className="blog-article-body max-w-none text-gray-800 leading-relaxed"
            style={{ fontFamily: "Roboto, Calibri, Helvetica, Arial, sans-serif" }}
          >
            {blog.description && /<\/?[a-z][\s\S]*>/i.test(blog.description) ? (
              <div dangerouslySetInnerHTML={{ __html: blog.description }} />
            ) : (
              (blog.description || "").split("\n").map((paragraph, index) =>
                paragraph.trim() ? (
                  <p key={index} className="mb-5 last:mb-0">
                    {paragraph}
                  </p>
                ) : null
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Share:</span>
            {/* WhatsApp share */}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${blog.blog_name} - ${baseUrl}/blog/${blog.blog_slug}`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition"
              title="Share on WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 0-5.555 2.51-5.555 5.576 0 1.042.208 2.053.611 3.031L2.111 22l3.285-.994c.908.504 1.93.779 2.961.779 3.065 0 5.555-2.51 5.555-5.576 0-1.483-.574-2.876-1.604-3.922-.93-.946-2.16-1.46-3.573-1.46z" />
              </svg>
            </a>
          </div>
          <Link
            href="/blog"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors text-sm"
          >
            ← Back to all posts
          </Link>
        </footer>
        </div>

        {otherBlogs.length > 0 && (
          <aside className="lg:sticky lg:top-28">
            <h2 className="text-base font-bold text-gray-900 mb-5">Other Blogs</h2>
            <div className="flex flex-col gap-5">
              {otherBlogs.map((item) => (
                <Link
                  key={item._id.toString()}
                  href={`/blog/${item.blog_slug}`}
                  className="flex gap-3 items-start group"
                >
                  <div className="w-[88px] h-[58px] flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.blog_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center text-lg">📰</div>
                    )}
                  </div>
                  <h3 className="text-[13px] font-semibold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors line-clamp-3">
                    {item.blog_name}
                  </h3>
                </Link>
              ))}
            </div>
          </aside>
        )}
        </div>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogPost(slug);
  const baseUrl = getBaseUrl();

  if (!blog) {
    return {
      title: "Blog Post | BEA",
      description: "Read expert appliance guides from BEA",
    };
  }

  const title =
    (blog.meta_title && blog.meta_title !== "none" && blog.meta_title.trim()) ||
    blog.blog_name ||
    "Blog Post | BEA";
  const description =
    (blog.meta_description &&
      blog.meta_description !== "none" &&
      blog.meta_description.trim()) ||
    stripHtml(blog.description || "").slice(0, 160) ||
    "Read expert appliance guides from BEA";
  const keywords = sanitizeMetaKeywords(blog.meta_keyword);
  const imageUrl = blog.image
    ? blog.image.startsWith("http")
      ? blog.image
      : `${baseUrl}${blog.image.startsWith("/") ? "" : "/"}${blog.image}`
    : undefined;

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: buildCanonicalUrl(`/blog/${blog.blog_slug}`),
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/blog/${blog.blog_slug}`,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
