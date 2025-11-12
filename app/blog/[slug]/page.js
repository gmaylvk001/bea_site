// app/blog/[slug]/page.js
import React from 'react';

async function getBlogPost(slug) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blogs/get`, {
      cache: 'no-store' // For dynamic data
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch blog posts');
    }
    
    const { data: blogs } = await res.json();
    // Find the blog with matching slug in the returned array
    const blog = blogs.find(blog => blog.blog_slug === slug);
    return blog || null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export default async function BlogPost({ params }) {
  const { slug } = params;
  const blog = await getBlogPost(slug);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Blog post not found</h1>
          <p className="text-gray-600 mb-6">The requested blog post could not be found.</p>
          <a 
            href="/blog" 
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Blog
          </a>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          
          <h5 className="text-4xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.blog_name}
          </h5>
          <div className="flex items-center text-gray-500">
            <span>
              Published on {new Date(blog.createdAt).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            {/* You could add author information here */}
            {/* <span className="mx-2">•</span>
            <span>By Author Name</span> */}
          </div>
        </header>

        {/* Featured Image */}
        {blog.image && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
            <img 
              src={blog.image} 
              alt={blog.blog_name}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="text-gray-700 leading-relaxed whitespace-pre-line">
            {blog.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-6 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          {/* Add tags or sharing buttons here if needed */}
          <div className="flex justify-end">
            <a 
              href="/blog" 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              ← Back to all posts
            </a>
          </div>
        </footer>
      </div>
    </article>
  );
}

// export async function generateMetadata({ params }) {
//   const { slug } = params;
//   const blog = await getBlogPost(slug);
  
//   return {
//     title: blog?.blog_name || 'Blog Post',
//     description: blog?.description?.slice(0, 160) || 'Read this interesting blog post',
//     openGraph: {
//       title: blog?.blog_name || 'Blog Post',
//       description: blog?.description?.slice(0, 160) || 'Read this interesting blog post',
//       images: blog?.image ? [{ url: blog.image }] : [],
//     },
//   };
// }