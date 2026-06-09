"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

// ─── Why Shop Items with asset icons ─────────────────────────────────────────
const WHY_SHOP_ITEMS = [
  { icon: "/location/AuthraizedBrand.png", title: "Authorized Brand Partner",  desc: "100% genuine products with official warranty" },
  { icon: "/location/FastDelivery.png", title: "Fast Delivery",              desc: "Quick & safe delivery across Tamil Nadu" },
  { icon: "/location/EasyEMI.png", title: "Easy EMI Options",           desc: "Flexible finance schemes for all" },
  { icon: "/location/Support.png", title: "Reliable Support",           desc: "Pre & post purchase support you can trust" },
  { icon: "/location/BestOffer.png", title: "Best Offers",                desc: "Exciting deals & exclusive store offers" },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.54 2 2 0 0 1 3.54 1.35h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 5.86 5.86l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.99 17z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="white">
      <path d="M16 3C9.4 3 4 8.4 4 15c0 2.6.8 5 2.2 7L4 29l7.2-2.2c1.9 1.1 4.1 1.7 6.3 1.7 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-2.1 0-4.1-.6-5.8-1.7l-.4-.2-4.3 1.3 1.3-4.2-.3-.4C5.6 18 5 16.6 5 15c0-6.1 4.9-11 11-11s11 4.9 11 11-4.9 11-11 11zm6-8.2c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.7 1.2 2.9c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.1-1.4z"/>
    </svg>
  );
}

function DirectionsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function LocationPinIcon({ color = "#2563EB", size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StoreTypeIcon({ color = "#2563EB", size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

// ─── Store Card ───────────────────────────────────────────────────────────────
function StoreCard({ store }) {
  const whatsappMsg = encodeURIComponent(
    `Bharath Electronics And Appliances ${store.organisation_name}, ${store.city}. ${store.website || ""}`
  );

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const titleCase = (str) =>
    str ? str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] overflow-hidden flex flex-col h-full">
      {/* Top: image + info */}
      <div className="flex gap-3 px-3.5 pt-3.5 pb-0">
        {/* Store image */}
        <div className="w-[130px] h-[140px] rounded-md flex-shrink-0 bg-[#1e3a8a] overflow-hidden flex items-center justify-center">
          {store.logo ? (
            <img
              src={store.logo}
              alt={store.organisation_name}
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <span className="text-blue-300 text-[11px] font-bold text-center px-1">BEA</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[13px] text-gray-900 mb-1 leading-snug">
            {store.organisation_name}
          </div>
          {(store.category || store.service_area) && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mb-1.5">
              {store.category || store.service_area}
            </span>
          )}
          {store.city && (
            <div className="text-[11px] text-gray-500 font-semibold mb-0.5">
              {capitalize(store.city)}
            </div>
          )}
          {store.address && (
            <div className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
              {titleCase(store.address)}
            </div>
          )}
          {store.phone && (
            <div className="flex items-center gap-1.5 mt-1.5 text-gray-700 text-[12px]">
              <PhoneIcon /> {store.phone}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
    <div className="flex items-center justify-between px-3.5 pt-2.5 pb-3.5 mt-auto gap-2">
        <Link href={`/store/${store.slug}`}>
          <button className="bg-blue-600 ms-4 hover:bg-blue-700 text-white border-none rounded-md py-[7px] px-3 text-[12px] font-semibold cursor-pointer transition-colors whitespace-nowrap">
            View Details
          </button>
        </Link>
 
        <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
          <button className="bg-[#25D366] hover:bg-[#1ebe5a] text-white border-none rounded-md py-[7px] px-2.5 cursor-pointer flex items-center justify-center transition-colors">
            <WhatsAppIcon />
          </button>
        </a>
 
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || store.organisation_name + " " + (store.city || ""))}`}
          target="_blank" rel="noopener noreferrer"
        >
          <button className="bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md py-[7px] px-3 text-[12px] font-semibold cursor-pointer flex items-center gap-1 transition-colors whitespace-nowrap">
            <DirectionsIcon /> Directions
          </button>
        </a>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BEABranchesPage() {

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedType, setSelectedType] = useState("All Store Types");
  const [showAll, setShowAll] = useState(false);
  const [appliedCity, setAppliedCity] = useState("All Cities");
 const [appliedType, setAppliedType] = useState("All Store Types");
  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch("/api/store/get");
        const data = await res.json();
        if (data.success) {
          setStores(data.data.filter((s) => s.status === "Active"));
        }
      } catch (err) {
        console.error("Failed to fetch stores", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const cities = useMemo(() => {
    const unique = [...new Set(stores.map((s) => s.city).filter(Boolean))].sort();
    return ["All Cities", ...unique];
  }, [stores]);

  const storeTypes = useMemo(() => {
    const unique = [...new Set(stores.map((s) => s.category || s.service_area).filter(Boolean))].sort();
    return ["All Store Types", ...unique];
  }, [stores]);

const filtered = useMemo(() => {
  return stores.filter((s) => {
    const cityMatch = appliedCity === "All Cities" || s.city === appliedCity;
    const typeMatch =
      appliedType === "All Store Types" ||
      s.category === appliedType ||
      s.service_area === appliedType;
    return cityMatch && typeMatch;
  });
}, [stores, appliedCity, appliedType]);

  const INITIAL_COUNT = 8;
  const visibleStores = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore = filtered.length > INITIAL_COUNT;

  const totalStores = stores.length;
  const totalCities = new Set(stores.map((s) => s.city).filter(Boolean)).size;

  return (
    <div className="font-sans bg-[#f8fafc] text-gray-900">
{/* ── Hero Banner ── */}

{/* DESKTOP — overlay layout */}
<div className="relative w-full hidden sm:block">
  <img
    src="/location/LocationBanner1.png"
    alt="BEA Store Network"
    className="w-full block object-cover"
    style={{ minHeight: '340px', maxHeight: '480px' }}
    onError={(e) => { e.target.style.display = "none"; }}
  />

  {/* White gradient overlay */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,0.3) 42%, rgba(255,255,255,0) 58%)',
    }}
  />

  {/* Left overlay text */}
  <div className="absolute inset-0 flex items-center">
    <div className="ml-14 max-w-[400px]">
      <p className="text-[30px] font-bold text-blue-900 mb-1 tracking-widest uppercase">
        BEA Store Network
      </p>
      <div className="leading-tight mb-0.5">
        <span className="text-[48px] font-black text-blue-700">
          {totalStores > 0 ? `${totalStores}+` : "47+"}
        </span>
        <span className="text-[48px] font-bold text-blue-900 ml-2">Showrooms.</span>
      </div>
      <div className="leading-tight mb-0.5">
        <span className="text-[48px] font-black text-blue-700">
          {totalCities > 0 ? `${totalCities}+` : "17+"}
        </span>
        <span className="text-[48px] font-bold text-blue-900 ml-2">Cities.</span>
      </div>
      <div className="text-[38px] font-black text-blue-900 mb-3">One Trusted Name.</div>
      <p className="text-[14.5px] text-blue-900 leading-relaxed max-w-[300px]">
        Find your nearest BEA showroom and experience Tamil Nadu&apos;s favourite
        destination for electronics &amp; home appliances.
      </p>
    </div>
  </div>

  {/* Stats bar — overlapping bottom */}
  <div className="absolute left-0 right-0 bottom-0 translate-y-1/2 z-10">
    <div style={{ marginLeft: '2.5rem', marginRight: '30%' }}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
        {[
          { icon: "/location/ShowRoom.png", value: `${totalStores > 0 ? totalStores : 47}+`, label: "Showrooms", sub: "Across Tamil Nadu" },
          { icon: "/location/Location.png", value: `${totalCities > 0 ? totalCities : 17}+`, label: "Cities",    sub: "Strong Presence" },
          { icon: "/location/HappyCustomer.png", value: "50 Lakh+",                               label: "Happy",     sub: "Customers" },
          { icon: "/location/25Years.png", value: "25+",                                    label: "Years of",  sub: "Trust & Excellence" },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <img
              src={stat.icon}
              alt={stat.label}
              className="w-[55px] h-[55px] object-contain flex-shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div>
              <div className="text-[20px] font-black text-blue-700 leading-none">{stat.value}</div>
              <div className="text-[15px] font-semibold text-gray-800">{stat.label}</div>
              <div className="text-[10.5px] text-gray-500">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

{/* Desktop spacer */}
<div className="hidden sm:block h-[70px] bg-[#f8fafc]" />

{/* MOBILE & TABLET — No banner, white bg, stacked */}
<div className="block sm:hidden bg-white px-5 pt-6 pb-4">
  <p className="text-[11px] font-semibold text-gray-500 mb-1 tracking-widest uppercase">
    BEA Store Network
  </p>
  <div className="leading-tight mb-0.5">
    <span className="text-[34px] font-black text-blue-700">
      {totalStores > 0 ? `${totalStores}+` : "47+"}
    </span>
    <span className="text-[26px] font-black text-gray-900 ml-1.5">Showrooms.</span>
  </div>
  <div className="leading-tight mb-0.5">
    <span className="text-[34px] font-black text-blue-700">
      {totalCities > 0 ? `${totalCities}+` : "17+"}
    </span>
    <span className="text-[26px] font-black text-gray-900 ml-1.5">Cities.</span>
  </div>
  <div className="text-[20px] font-black text-gray-900 mb-2">One Trusted Name.</div>
  <p className="text-[12px] text-gray-600 leading-relaxed mb-5">
    Find your nearest BEA showroom and experience Tamil Nadu&apos;s favourite
    destination for electronics &amp; home appliances.
  </p>

  {/* Stats — 2x2 grid on mobile */}
  <div className="grid grid-cols-2 gap-3">
    {[
      { icon: "/location/ShowRoom.png", value: `${totalStores > 0 ? totalStores : 47}+`, label: "Showrooms", sub: "Across Tamil Nadu" },
      { icon: "/location/AuthraizedBrand.png", value: `${totalCities > 0 ? totalCities : 17}+`, label: "Cities",    sub: "Strong Presence" },
      { icon: "/location/FastDelivery.png", value: "50 Lakh+",                               label: "Happy",     sub: "Customers" },
      { icon: "/location/EasyEMI.png", value: "25+",                                    label: "Years of",  sub: "Trust & Excellence" },
    ].map((stat, i) => (
      <div key={i} className="flex items-center gap-3 bg-[#f8fafc] rounded-xl px-4 py-3 border border-gray-100">
        <img
          src={stat.icon}
          alt={stat.label}
          className="w-8 h-8 object-contain flex-shrink-0"
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <div>
          <div className="text-[16px] font-black text-blue-700 leading-none">{stat.value}</div>
          <div className="text-[11px] font-semibold text-gray-800">{stat.label}</div>
          <div className="text-[10px] text-gray-500">{stat.sub}</div>
        </div>
      </div>
    ))}
  </div>
</div>

      {/* ── Find Store Section ── */}
      <div id="find-store-section" className="bg-white px-6 sm:px-10 pt-10 pb-8">
        <h2 className="text-center text-[21px] font-bold text-gray-900 mb-5">
          Find Your Nearest BEA Store
        </h2>

        {/* ── Filters Row ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-7">

          {/* City Dropdown */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <LocationPinIcon color="#2563EB" size={14} />
            </span>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setShowAll(false); }}
              className="w-full h-[44px] pl-8 pr-9 border border-gray-300 rounded-lg text-[13.5px] appearance-none bg-white cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">▾</span>
          </div>

          {/* Store Type Dropdown */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              <StoreTypeIcon color="#2563EB" size={14} />
            </span>
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setShowAll(false); }}
              className="w-full h-[44px] pl-8 pr-9 border border-gray-300 rounded-lg text-[13.5px] appearance-none bg-white cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {storeTypes.map((t) => <option key={t}>{t}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">▾</span>
          </div>

          {/* Find Store Button — same height as dropdowns */}
<button
  onClick={() => {
    setAppliedCity(selectedCity);
    setAppliedType(selectedType);
    setShowAll(false);
  }}
  className="h-[44px] w-[400px] bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg px-6 text-[13.5px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-colors sm:flex-shrink-0"
>
  Find Store <SearchIcon />
</button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading stores...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-[15px]">No stores found for the selected filters.</p>
          </div>
        ) : (
          <>
            {/* ── Store Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
              {visibleStores.map((store) => (
                <StoreCard key={store._id} store={store} />
              ))}

              {/* "And Many More" card — only when not showAll and hasMore */}
              {!showAll && hasMore && (
                <div className="bg-white border border-gray-200 rounded-[10px] flex flex-col items-center justify-center px-5 py-8 gap-2.5 min-h-[200px]">
                  <img
                    src="/location/ShowRoom.png"
                    alt="More Stores"
                    className="w-14 h-14 object-contain"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="font-bold text-[15px] text-gray-900 text-center">And Many More...</div>
                  <div className="text-gray-500 text-[12px] text-center leading-relaxed">
                    {totalStores}+ showrooms across<br />{totalCities}+ cities in Tamil Nadu
                  </div>
                  <button
                    onClick={() => setShowAll(true)}
                    className="bg-transparent text-blue-600 border-none font-bold text-[13px] cursor-pointer underline"
                  >
                    View All Stores
                  </button>
                </div>
              )}
            </div>

            {/* View All / Show Less */}
            <div className="text-center pt-5 pb-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg px-7 py-2.5 text-[13.5px] font-bold cursor-pointer inline-flex items-center gap-2 transition-colors"
              >
                {showAll ? "Show Less ▲" : `View All Stores (${filtered.length}) ▾`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Why Shop at BEA ── */}
      <div className="bg-white px-6 sm:px-10 pt-12 pb-0">

        {/* LocationBanner2 */}
        <div className="rounded-xl overflow-hidden mb-7">
          <img
            src="/location/LocationBanner2.png"
            alt=""
            className="w-full object-cover block"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>

        {/* Section Title */}
        <h2 className="text-center text-[21px] font-bold text-gray-900 mb-6">
          Why Shop at BEA?
        </h2>

        {/* ── Why Shop Cards — left icon + right content ── */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-10">
          {WHY_SHOP_ITEMS.map((item, i) => (
            <div
              key={i}
              className="bg-[#f8fafc] border border-gray-200 rounded-xl px-4 py-4 flex items-center gap-3 flex-[1_1_180px] max-w-[220px]"
            >
              {/* Left: Icon */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-[50px] h-[50px] object-contain"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
              {/* Right: Text */}
              <div className="min-w-0">
                <div className="font-bold text-[12.5px] text-gray-900 mb-0.5 leading-snug">{item.title}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

      {/* LocationBanner3 — Desktop: buttons overlay, Mobile: buttons below */}
<div className="rounded-xl overflow-hidden">

  {/* DESKTOP — buttons overlay on banner */}
  <div className="relative hidden sm:block">
    <img
      src="/location/LocationBanner3.png"
      alt="Visit BEA Store"
      className="w-full max-h-[260px] object-cover block"
      onError={(e) => { e.target.style.display = "none"; }}
    />
    {/* Right side buttons overlay */}
    <div className="absolute inset-0 flex items-center justify-end pr-10">
      <div className="flex items-center gap-3">
        <a href="#find-store-section">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg px-5 py-2.5 text-[13.5px] transition-colors whitespace-nowrap">
            Find Store
            <LocationPinIcon color="white" size={15} />
          </button>
        </a>
        <Link href="/">
          <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-700 font-bold rounded-lg px-5 py-2.5 text-[13.5px] border border-white transition-colors whitespace-nowrap">
            Shop Online
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </Link>
      </div>
    </div>
  </div>

  {/* MOBILE & TABLET — banner + buttons below */}
  <div className="block sm:hidden">
    <img
      src="/location/LocationBanner3.png"
      alt="Visit BEA Store"
      className="w-full max-h-[200px] object-cover block"
      onError={(e) => { e.target.style.display = "none"; }}
    />
    <div className="flex items-center gap-3 justify-center py-4 bg-[#1e3a8a]">
      <a href="#find-store-section">
        <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg px-5 py-2.5 text-[13px] transition-colors whitespace-nowrap">
          Find Store
          <LocationPinIcon color="white" size={14} />
        </button>
      </a>
      <Link href="/">
        <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-700 font-bold rounded-lg px-5 py-2.5 text-[13px] border border-white transition-colors whitespace-nowrap">
          Shop Online
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </button>
      </Link>
    </div>
  </div>

</div>
      </div>

    </div>
  );
}