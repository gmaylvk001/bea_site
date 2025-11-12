"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const CACHE_KEY = 'site_initial_cache_v1';
const API_LIST = {
  banners: '/api/topbanner',
  categories: '/api/categories/get',
  brands: '/api/brand/get',
  products: '/api/product/get',
  flashsales: '/api/flashsale',
  homeSections: '/api/home-sections',
};

// small helper to fetch JSON with timeout
const fetchWithTimeout = async (url, timeout = 6000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
};

export default function HomeComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const readCache = () => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    };

    const writeCache = (payload) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
    };

    const load = async () => {
      // try cached first
      const cached = readCache();
      if (cached) {
        if (!mounted) return;
        setData(cached);
        setLoading(false);
        return;
      }

      // First load: fetch all endpoints in parallel with short timeouts
      const keys = Object.keys(API_LIST);
      const promises = keys.map((k) => fetchWithTimeout(API_LIST[k], 6000));

      const results = await Promise.all(promises);

      // Normalize and pick minimal fields to reduce storage size
      const payload = {};
      keys.forEach((k, idx) => {
        const res = results[idx];
        payload[k] = res || null;
      });

      // store to cache and state
      writeCache(payload);
      if (!mounted) return;
      setData(payload);
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">Loading…</div>
    </div>
  );

  // lightweight renderers that handle missing data gracefully
  const Banners = ({ items }) => {
    if (!items || !Array.isArray(items)) return null;
    const imgs = items.length ? items : [];
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-2">Banners</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {imgs.map((b, i) => (
            <div key={i} className="bg-gray-100 p-3 rounded">
              <a href={(b && b.redirect_url) || '#'}>
                <img src={(b && (b.banner_image || b.bgImageUrl)) || '/placeholder.jpg'} alt={b && b._id} style={{ maxWidth: '100%', height: '120px', objectFit: 'cover' }} />
              </a>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Categories = ({ items }) => {
    if (!items || !Array.isArray(items)) return null;
    const visible = items.filter(c => c.status === 'Active');
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-2">Categories</h2>
        <div className="flex gap-2 flex-wrap">
          {visible.slice(0, 12).map(cat => (
            <Link key={cat._id} href={`/category/${cat.category_slug}`} className="px-3 py-1 bg-white rounded shadow-sm text-sm">{cat.category_name}</Link>
          ))}
        </div>
      </div>
    );
  };

  const Brands = ({ items }) => {
    if (!items || !Array.isArray(items)) return null;
    const list = items.brands || items.data || items;
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-2">Brands</h2>
        <div className="flex gap-3 flex-wrap">
          {Array.isArray(list) ? list.slice(0, 12).map(b => (
            <div key={b._id || b.id} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{b.brand_name || b.name}</div>
          )) : null}
        </div>
      </div>
    );
  };

  const Products = ({ items }) => {
    if (!items || !Array.isArray(items)) return null;
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-2">Products (sample)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.slice(0, 12).map(p => (
            <Link key={p._id} href={`/product/${p.slug || p._id}`} className="block bg-white p-2 rounded shadow-sm text-xs">
              <div style={{height:80,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src={p.images?.[0] ? `/uploads/products/${p.images[0]}` : '/placeholder.jpg'} alt={p.name} style={{maxHeight: '100%', maxWidth:'100%'}} />
              </div>
              <div className="mt-2 line-clamp-2">{p.name}</div>
              <div className="text-sm font-semibold">₹{p.special_price ?? p.price}</div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const FlashSales = ({ items }) => {
    const list = items?.flashSales || items?.data || items || [];
    if (!list || list.length === 0) return null;
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-2">Flash Sales</h2>
        <div className="flex gap-3 overflow-x-auto">
          {list.slice(0,6).map((s, i) => (
            <a key={i} className="min-w-[200px] bg-white rounded p-2 shadow-sm" href={s.redirectUrl || '#'}>
              <img src={s.productImage || s.banner_image || '/placeholder.jpg'} alt={s.title} style={{width:'100%',height:100,objectFit:'cover'}} />
              <div className="mt-1 text-sm">{s.title || s.name}</div>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto">
        <header className="p-4 border-b bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">My Shop</div>
            <nav className="text-sm">
              <a href="#" className="px-2">Home</a>
              <a href="#" className="px-2">Deals</a>
            </nav>
          </div>
        </header>

        <section className="p-4">
          <Banners items={data.banners?.banners || data.banners || data.banners?.items || []} />
        </section>

        <section className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <Categories items={data.categories || data.categories?.data} />
            <Brands items={data.brands || data.brands?.data} />
          </div>
          <div className="lg:col-span-2">
            <Products items={data.products || data.products?.data || []} />
            <FlashSales items={data.flashsales || data.flashsales?.data} />
          </div>
        </section>

        <footer className="p-4 text-center text-xs text-gray-500">Cached data key: {CACHE_KEY}</footer>
      </div>
    </main>
  );
}
