import React, { useEffect, useState } from "react";
import Link from 'next/link';

export default function BlogComponent() {
  const [blogs, setBlogs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/blogs/get");
        const json = await res.json();
        if (json.success) {
          const activeBlogs = json.data.filter(blog => blog.status === "Active");
          setBlogs(activeBlogs);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.innerHeight + window.scrollY;
    
     const scroll_blogElement = document.getElementById('scroll_blog');

  if (scroll_blogElement) {
    const fullHeight = scroll_blogElement.offsetHeight;
    // When user scrolls near the bottom (100px remaining)
    if (scrollTop >= fullHeight - 100) {
      // Load 3 more blogs
      setVisibleCount((prev) => prev + 3);
    }
  }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const visibleBlogs = blogs.slice(0, visibleCount);

  return (
    <>
      <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Blog</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">🏠 Home</span>
          <span className="text-gray-500">›</span>
          <span className="text-orange-500 font-semibold">Blog</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4 sm:p-6 " id="scroll_blog">
        {visibleBlogs.length > 0 ? (
          visibleBlogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
              <img
                src={blog.image || "/default-blog.jpg"}
                alt={blog.blog_name}
                className="h-48 w-full object-cover"
              />
              <span className="text-orange-500 text-xs bg-orange-100 px-2 rounded w-max mb-2">
                {new Date(blog.createdAt).toLocaleDateString('en-GB')}
              </span>
              <div className="p-3 flex flex-col flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {blog.blog_name}
                </h3>
                <p className="text-gray-600 flex-1">{blog.description.slice(0, 100)}...</p>
                <Link
                  href={`/blog/${blog.blog_slug}`}
                  className="mt-4 text-orange-500 hover:underline text-sm font-medium"
                >
                  Read More &rarr;
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No active blogs found.</p>
        )}
      </div>
    </>
  );
}
