"use client";
import React from 'react';
import useDailyData from '@/hooks/useDailyData';
import Image from 'next/image';
import IndexComponent from "../components/index";

export default function HomePage() {
  const { data, loading, error, refresh } = useDailyData({ key: 'siteSections', url: '/api/sections' });

  const products = data?.products || [];
  const categories = data?.categories || [];
  const blogs = data?.blogs || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <button onClick={refresh} className="px-4 py-2 bg-blue-600 text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
    <IndexComponent />
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Homepage sections (from daily cache)</h1>
        <button onClick={refresh} className="px-3 py-2 bg-blue-600 text-white rounded">Refresh</button>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.length === 0 ? (
            <div className="text-gray-500">No products available</div>
          ) : (
            products.map((p) => (
              <div key={p._id} className="bg-white p-3 rounded shadow">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.name} width={300} height={300} className="object-contain" />
                ) : (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">No image</div>
                )}
                <h3 className="mt-2 font-medium text-sm">{p.name}</h3>
                <div className="text-blue-600 font-semibold">₹{p.price}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Categories</h2>
        <div className="flex flex-wrap gap-3">
          {categories.length === 0 ? (
            <div className="text-gray-500">No categories</div>
          ) : (
            categories.map((c) => (
              <div key={c._id} className="px-3 py-2 bg-white rounded shadow-sm">{c.category_name}</div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Blogs</h2>
        <div className="space-y-4">
          {blogs.length === 0 ? (
            <div className="text-gray-500">No blogs</div>
          ) : (
            blogs.map((b) => (
              <div key={b._id} className="p-3 bg-white rounded shadow-sm">
                <h3 className="font-semibold">{b.title}</h3>
                <p className="text-sm text-gray-600">{b.excerpt}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
    </div>
  );
}
