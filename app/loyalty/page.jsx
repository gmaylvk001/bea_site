"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

const faqs = [
  {
    q: "What is BEA Loyalty Programme?",
    a: "BEA Loyalty is a cardless loyalty programme that rewards you with points on every purchase. Use your mobile number as your membership ID — no card needed!",
  },
  {
    q: "How do I earn points?",
    a: "You earn loyalty points automatically on every completed purchase. Points are calculated based on your order value and credited to your account after payment.",
  },
  {
    q: "How do I redeem my points?",
    a: "During checkout, click 'Use All Points' to apply your loyalty points as a discount. 1 point = ₹1 discount on your next purchase.",
  },
  {
    q: "Is there a minimum points required for redemption?",
    a: "No minimum balance required! You can redeem any amount of loyalty points during checkout.",
  },
  {
    q: "Is there a registration fee?",
    a: "Absolutely not! The BEA Loyalty Programme is completely free. Just shop and earn!",
  },
  {
    q: "What is my membership number?",
    a: "Your registered mobile number is your membership number. No separate card or ID needed.",
  },
  {
    q: "Do my points expire?",
    a: "Points validity depends on your account activity. Keep shopping to keep your points active!",
  },
];

const benefits = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/><path d="M9 7h6"/><path d="M9 11h6"/>
      </svg>
    ),
    title: "Fully Cardless",
    desc: "Your mobile number is your membership ID. No cards, no app downloads, no plastic — just your phone number.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
      </svg>
    ),
    title: "Linear Rewards",
    desc: "No complex tiers. Every rupee spent earns points at the same rate — straightforward and transparent.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: "Zero Minimums",
    desc: "Redeem even a single point. There are no thresholds, no lock-in periods, no minimum balance requirements.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
    title: "Free to Join",
    desc: "Zero entry fee. Your account is created automatically with your first transaction. Just shop and start earning.",
  },
];

const steps = [
  {
    num: "01",
    title: "Shop & Purchase",
    desc: "Browse our full catalog of products and place your order. Points are automatically linked to your registered mobile number — no sign-up needed.",
    tag: "Auto-enrollment on first purchase",
    tagIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    imgSrc: "/loyalty/image2.png",
    imgAlt: "Shopping step illustration",
  },
  {
    num: "02",
    title: "Earn Instantly",
    desc: "Points are credited automatically after every successful payment. No waiting period. Every rupee spent translates directly into redeemable points.",
    tag: "Instant post-payment credit",
    tagIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    imgSrc: "/loyalty/image3.png",
    imgAlt: "Points earning illustration",
  },
  {
    num: "03",
    title: "Redeem at Checkout",
    desc: "At checkout, tap 'Use All Points' to apply your full balance as a discount. 1 Point = ₹1 — always. No hidden conditions.",
    tag: "1 Point = ₹1 always",
    tagIcon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    imgSrc: "/loyalty/image4.png",
    imgAlt: "Checkout redemption illustration",
  },
];

const banners = [
  { imgSrc: "/loyalty/banner1.png", imgAlt: "Banner 1" },
  { imgSrc: "/loyalty/banner2.png", imgAlt: "Banner 2" },
  { imgSrc: "/loyalty/banner3.png", imgAlt: "Banner 3" },
];

export default function LoyaltyPage() {
  const router = useRouter();
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkPhone, setCheckPhone] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setIsLoggedIn(false); setLoading(false); return; }
        const authRes = await fetch("/api/auth/check", { headers: { Authorization: `Bearer ${token}` } });
        const authData = await authRes.json();
        if (!authData.loggedIn) { setIsLoggedIn(false); setLoading(false); return; }
        setIsLoggedIn(true);
        const decoded = jwtDecode(token);
        setCustomerName(decoded.name || "Customer");
        const loyaltyRes = await fetch(`/api/award-points?phone=${authData.phone || ""}`);
        const loyaltyData = await loyaltyRes.json();
        setPoints(loyaltyData.success ? loyaltyData.points : 0);
      } catch (err) {
        console.error("Loyalty fetch error:", err);
        setPoints(0);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveBanner((prev) => (prev + 1) % banners.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckPoints = async () => {
    if (!checkPhone || checkPhone.length < 10) return;
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await fetch(`/api/award-points?phone=${checkPhone}`);
      const data = await res.json();
      setCheckResult(data);
    } catch {
      setCheckResult({ success: false });
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] font-sans text-[#1a2236] antialiased">

      {/* ── HERO ── */}
      <section className="h-150 bg-[#0A1628] flex items-center justify-center relative overflow-hidden pt-16 pb-0 px-4">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#1D4ED8]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-[#1D4ED8]/15 text-blue-300 border border-blue-500/20 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Premium Rewards Programme
            </div>
            <h1 className="font-black text-white leading-[1.05] text-[2.8rem] sm:text-[3.5rem] mb-5 tracking-[-2px]" style={{ fontFamily: "'Syne', sans-serif" }}>
              Shop More.<br />
              Earn <span style={{ color: "#60A5FA" }}>Smarter.</span><br />
              Redeem Freely.
            </h1>
            <p className="text-[#94A3C8] text-base leading-relaxed max-w-md mb-8">
              Every purchase earns you real value — no cards, no minimums, no friction. Your mobile number is all you need.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/rewards")}
                className="inline-flex items-center gap-2.5 bg-[#1D4ED8] text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-[#1a44c4] transition active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
                Unlock Rewards
              </button>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 bg-transparent text-[#94A3C8] font-semibold text-sm px-5 py-3.5 rounded-xl border border-white/10 hover:border-white/25 hover:text-white transition"
              >
                How It Works
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14m7-7-7 7-7-7"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Right - Card */}
          <div className="hidden md:block">
            <div className="bg-white/[0.05] border border-white/[0.1] rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-black text-white text-sm tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>BEA Loyalty</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]/40" />
                </div>
              </div>
              <div className="w-full h-44 rounded-2xl overflow-hidden mb-5 bg-[#1D4ED8]/10">
                <img src="/loyalty/image1.png" alt="Loyalty visual" className="w-full h-full object-cover rounded-2xl" />
              </div>
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span className="text-blue-200 text-xs">Loading balance...</span>
                </div>
              )}
              {!loading && isLoggedIn && points !== null && (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[#64748B] text-[10px] uppercase tracking-widest mb-1">Accrued Points</p>
                    <p className="text-white font-black text-3xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {points.toLocaleString()} <span className="text-sm font-normal text-[#64748B]">Pts</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Cash Value</p>
                    <p className="text-emerald-400 font-black text-2xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>₹{points.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {!loading && !isLoggedIn && (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[#64748B] text-[10px] uppercase tracking-widest mb-1">Accrued Points</p>
                    <p className="text-white font-black text-3xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                      1,240 <span className="text-sm font-normal text-[#64748B]">Pts</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 text-[10px] font-semibold uppercase tracking-widest mb-1">Cash Value</p>
                    <p className="text-emerald-400 font-black text-2xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>₹1,240</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="bg-[#0A1628] border-b border-white/[0.07]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, num: "1:1", label: "Point to ₹ Ratio" },
            { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, num: "₹0", label: "Registration Fee" },
            { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>, num: "0 Min", label: "Points for Redemption" },
            { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>, num: "Cardless", label: "Mobile Number as ID" },
          ].map((s, i) => (
            <div key={i} className={`py-6 px-6 flex flex-col items-center gap-2 ${i < 3 ? "border-r border-white/[0.07]" : ""}`}>
              <span className="text-[#1D4ED8]">{s.icon}</span>
              <p className="font-black text-white text-lg tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{s.num}</p>
              <p className="text-[#64748B] text-xs text-center">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── BANNER SECTION ── */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-2">
        <div className="relative rounded-2xl overflow-hidden bg-[#1a2236]" style={{ aspectRatio: "3/1" }}>
          {banners.map((banner, i) => (
            <img
              key={i}
              src={banner.imgSrc}
              alt={banner.imgAlt}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: activeBanner === i ? 1 : 0 }}
            />
          ))}
          {/* Subtle dark gradient at bottom for dot visibility */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveBanner(i)}
                className={`rounded-full transition-all duration-300 ${activeBanner === i ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── LOGGED IN DASHBOARD ── */}
      {!loading && isLoggedIn && points !== null && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border border-[#D1DCF0] shadow-sm p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8EDF5]">
              <div>
                <p className="text-[#64748B] text-xs font-semibold uppercase tracking-widest">Club Member</p>
                <h3 className="text-xl font-bold text-[#1a2236] mt-0.5">
                  Welcome back, <span className="text-[#1D4ED8] font-black">{customerName}</span>
                </h3>
              </div>
              <button
                onClick={() => router.push("/checkout")}
                className="inline-flex items-center gap-2.5 bg-[#1D4ED8] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a44c4] transition active:scale-[0.98]"
              >
                Use Points at Checkout
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-[#F5F8FF] p-6 rounded-2xl border border-[#DDEAFF]">
                <p className="text-[#4B6087] text-xs font-semibold uppercase tracking-widest mb-3">Accrued Balance</p>
                <p className="text-4xl font-black text-[#1a2236] tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {points.toLocaleString()} <span className="text-sm font-medium text-[#64748B]">Pts</span>
                </p>
              </div>
              <div className="bg-[#F0FBF6] p-6 rounded-2xl border border-[#C6EDD9]">
                <p className="text-[#2D7A52] text-xs font-semibold uppercase tracking-widest mb-3">Cashback Equivalent</p>
                <p className="text-4xl font-black text-[#1A6640] tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  ₹{points.toLocaleString()}.00
                </p>
                <p className="text-[#4B6087] text-[11px] mt-1">1 Point = ₹1</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOT LOGGED IN - PHONE CHECK ── */}
      {!loading && !isLoggedIn && (
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl border border-[#D1DCF0] shadow-sm p-6 sm:p-8">
            <h3 className="text-xl font-black text-[#1a2236] text-center" style={{ fontFamily: "'Syne', sans-serif" }}>Check Point Balance</h3>
            <p className="text-[#4B6087] text-sm text-center mt-1 mb-6">Enter your registered mobile number below</p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B6087] text-sm font-semibold">+91</span>
                  <input
                    type="tel"
                    value={checkPhone}
                    onChange={(e) => setCheckPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Mobile number"
                    maxLength={10}
                    className="w-full border border-[#D1DCF0] bg-[#F5F8FF] rounded-xl pl-14 pr-4 py-3 text-sm font-medium text-[#1a2236] placeholder-[#94A3B8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1D4ED8]/20 focus:border-[#1D4ED8] transition"
                  />
                </div>
                <button
                  onClick={handleCheckPoints}
                  disabled={checkLoading || checkPhone.length < 10}
                  className="bg-[#1D4ED8] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#1a44c4] transition active:scale-[0.97] disabled:bg-[#CBD5E1] disabled:text-[#94A3B8]"
                >
                  {checkLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Check"}
                </button>
              </div>
              {checkResult && (
                <div className={`rounded-xl p-4 text-sm font-medium ${checkResult.success ? "bg-[#F0FBF6] border border-[#C6EDD9] text-[#1A6640]" : "bg-[#FFF5F5] border border-[#FED7D7] text-[#C53030]"}`}>
                  {checkResult.success ? (
                    <div className="flex gap-2.5 items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                      </svg>
                      <div>
                        <p className="font-bold">Account Located!</p>
                        <p className="font-normal text-[#2D7A52] text-xs mt-0.5">
                          You have <strong>{checkResult.points.toLocaleString()} loyalty points</strong> worth <strong>₹{checkResult.points.toLocaleString()}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2.5 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      No account found for this mobile number.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 pt-5 border-t border-[#E8EDF5] text-center">
              <p className="text-[#64748B] text-xs">Want full dashboard access?</p>
              <button
                onClick={() => router.push("/")}
                className="mt-1 text-[#1D4ED8] text-sm font-bold hover:text-[#1a44c4] transition inline-flex items-center gap-1.5"
              >
                Login to your account
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-24">
        <div className="mb-16">
          <span className="inline-flex items-center gap-1.5 bg-[#EBF0FF] text-[#1D4ED8] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-[#C7D7FF]">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            How It Works
          </span>
          <h2 className="font-black text-[#1a2236] tracking-tight text-3xl sm:text-4xl" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>
            Three steps to rewards
          </h2>
          <p className="text-[#4B6087] text-sm mt-2 max-w-sm">
            Designed for zero friction — from your first purchase to your first redemption.
          </p>
        </div>
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div key={i} className={`grid grid-cols-1 md:grid-cols-2 gap-10 items-center ${i % 2 !== 0 ? "md:[direction:rtl]" : ""}`}>
              {/* Image — no overlay text */}
              <div className={`relative rounded-2xl overflow-hidden aspect-[4/3] bg-[#E8EDF5] border border-[#D1DCF0] ${i % 2 !== 0 ? "md:[direction:ltr]" : ""}`}>
                <img src={step.imgSrc} alt={step.imgAlt} className="w-full h-full object-cover" />
              </div>
              {/* Content */}
              <div className={i % 2 !== 0 ? "md:[direction:ltr]" : ""}>
                <div className="text-6xl font-black text-[#D1DCF0] leading-none mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {step.num}
                </div>
                <h3 className="font-black text-[#1a2236] text-2xl mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {step.title}
                </h3>
                <p className="text-[#4B6087] text-sm leading-relaxed mb-4">{step.desc}</p>
                <span className="inline-flex items-center gap-1.5 bg-[#EBF0FF] border border-[#C7D7FF] text-[#1D4ED8] text-xs font-semibold px-3 py-2 rounded-full">
                  {step.tagIcon}
                  {step.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="bg-[#0A1628] py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-[#1D4ED8]/15 text-blue-300 border border-blue-500/20 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Programme Benefits
              </span>
              <h2 className="font-black text-white text-3xl sm:text-4xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>
                Everything you need,<br />nothing you don't.
              </h2>
            </div>
            <p className="text-[#64748B] text-sm max-w-xs">
              Built around simplicity — your loyalty should feel like a reward, not a chore.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 items-start bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-[#1D4ED8]/20 border border-[#1D4ED8]/30 flex items-center justify-center text-[#60A5FA] flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-black text-white text-base mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{b.title}</h3>
                  <p className="text-[#64748B] text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UNLOCK REWARDS ── */}
      <section className="py-24 px-4 bg-[#F0F4FA]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#EBF0FF] text-[#1D4ED8] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4 border border-[#C7D7FF]">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/>
              </svg>
              Start Redeeming
            </span>
            <h2 className="font-black text-[#1a2236] text-3xl sm:text-4xl tracking-tight mb-4" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>
              Your points are<br />ready to be used.
            </h2>
            <p className="text-[#4B6087] text-sm leading-relaxed mb-6">
              You've been earning with every order. Now it's time to redeem. Check your balance and apply it to your next purchase in seconds.
            </p>
            <ul className="space-y-0 mb-8 divide-y divide-[#E8EDF5]">
              {[
                "Instant balance lookup with your mobile number",
                "Apply points directly at checkout",
                "Real ₹1 value for every point",
                "No expiry while your account is active",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3 text-[#2D3A52] text-sm font-medium">
                  <span className="w-5 h-5 rounded-full bg-[#EBF0FF] border border-[#C7D7FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => router.push("/rewards")}
              className="inline-flex items-center gap-3 bg-[#1D4ED8] text-white font-bold text-sm px-7 py-4 rounded-2xl hover:bg-[#1a44c4] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              Unlock Rewards
              <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>
            </button>
          </div>

          <div className="relative">
            <div className="w-full aspect-square rounded-3xl overflow-hidden bg-[#E8EDF5]">
              <img src="/loyalty/image5.png" alt="Rewards visual" className="w-full h-full object-cover rounded-3xl" />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white border border-[#D1DCF0] rounded-2xl px-5 py-3.5 shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF0FF] border border-[#C7D7FF] flex items-center justify-center text-[#1D4ED8]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <div>
                <p className="text-[#64748B] text-[10px] mb-0.5">Your balance is worth</p>
                <p className="text-[#1D4ED8] font-black text-base tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {isLoggedIn && points ? `₹${points.toLocaleString()} Savings` : "₹1,240 Savings"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-white border-t border-[#E8EDF5] py-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 bg-[#EBF0FF] text-[#1D4ED8] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3 border border-[#C7D7FF]">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              FAQ
            </span>
            <h2 className="font-black text-[#1a2236] text-3xl tracking-tight" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-1px" }}>
              Common Questions
            </h2>
            <p className="text-[#4B6087] text-sm mt-2">Everything you need to know about the BEA Loyalty Programme</p>
          </div>
          <div className="space-y-2.5">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? "border-[#1D4ED8] shadow-sm shadow-[#1D4ED8]/10" : "border-[#D1DCF0] hover:border-[#B0C4E8]"}`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex justify-between items-center px-5 py-4 text-left gap-4"
                  >
                    <span className="font-semibold text-[#1a2236] text-sm">{faq.q}</span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? "bg-[#EBF0FF] text-[#1D4ED8] rotate-45" : "bg-[#F0F4FA] text-[#4B6087]"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40" : "max-h-0"}`}>
                    <p className="px-5 pb-4 pt-3 text-[#4B6087] text-sm leading-relaxed border-t border-[#E8EDF5] bg-[#F8FAFD]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      {!isLoggedIn && (
        <section className="relative bg-[#0A1628] border-t border-white/[0.07] py-16 text-center px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px"
          }} />
          <div className="relative max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1D4ED8]/15 border border-[#1D4ED8]/25 mb-5 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              Begin Accumulating Value
            </h2>
            <p className="text-[#64748B] text-sm mb-6 max-w-sm mx-auto">
              Shop now and start earning real rewards on every purchase.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2.5 bg-white text-[#1a2236] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#F0F4FA] transition active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              Shop Inventory Now
            </button>
          </div>
        </section>
      )}

    </div>
  );
}