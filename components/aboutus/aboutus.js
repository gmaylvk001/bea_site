'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BsFillAwardFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { GiNetworkBars } from "react-icons/gi";
import { FaThumbsUp } from "react-icons/fa";
import { FiHeadphones,  FiSettings,FiTag, FiTarget, FiMapPin, FiAward, FiUsers,FiUser,  FiMonitor, FiSpeaker, FiShoppingCart, FiStar, FiHome, FiBriefcase, FiPackage, FiCreditCard, FiTrendingUp, FiGift } from 'react-icons/fi';
import { useRouter } from "next/navigation";

const AboutUs = () => {
    const router = useRouter();
    const chooseData = [{
        image: "/uploads/products.png",
        icon: <FiMapPin />,
        title: "100% Genuine Products",
        desc: "Authorized retailer for leading electronics and home appliance brands."
    },
    {
        image: "/uploads/wide_product.png",
        icon: <FiShoppingCart />,
        title: "Wide Product Range",
        desc: "5000+ products including TVs, refrigerators, ACs and mobiles."
    },
    {
        image: "/uploads/customer_first_approach.png",
        icon: <FiUsers />,
        title: "Customer First Approach",
        desc: "Trusted by families for honest advice and better service."
    },
    {
        image: "/uploads/47_store.png",
        icon: <FiHome />,
        title: "47+ Store Network",
        desc: "Always near you with 47+ showrooms across Tamil Nadu."
    },
    {
        image: "/uploads/flexiable_finance_options.png",
        icon: <FiCreditCard />,
        title: "Flexible Finance Options",
        desc: "Easy EMI & finance solutions from leading banks."
    },
    {
        image: "/uploads/realiable_support.png",
        icon: <FiHeadphones />,
        title: "Reliable Support",
        desc: "Before & after purchase support, installation & service."
    }];

    const storeExperience = [{
        image: "/uploads/tv_zone.png",
        title: "TV Experience Zone",
        },
        {
            image: "/uploads/kitchen_appliances.png",
            title: "Kitchen Appliance Zone",
        },
        {
            image: "/uploads/ref_zone.png",
            title: "Refrigerator Zone",
        },
        {
            image: "/uploads/ac_zone.png",
            title: "AC Experience Zone",
        },
        {
            image: "/uploads/customer_interaction.png",
            title: "Customer Interaction",
        },
        {
            image: "/uploads/fast_safe_delivery.png",
            title: "Fast & Safe Delivery",
        },
    ];

    const brands = [
        "/uploads/Brands/brand_1778758654308.png",
        "/uploads/Brands/brand_1778764524439.png",
        "/uploads/Brands/brand_1778994553980.png",
        "/uploads/Brands/brand_1778996291806.png",
        "/uploads/Brands/brand_1779078793650.png",
        "/uploads/Brands/panasonic.jpg",
        "/uploads/Brands/brand_1778764090037.png",
        "/uploads/Brands/brand-1754720247059.webp",
        "/uploads/Brands/VIw4LetLiEoOuqOk.webp",
        "/uploads/Brands/brand-1754545986132.webp",
    ];

    return (
        <div className="text-[#1d1d1f]">
            {/* 🟠 About us Header Bar */}
            <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                <Link href="/" className="text-gray-600 hover:text-blue-600">🏠 Home</Link>
                <span className="text-gray-500">›</span>
                <span className="text-blue-600 font-semibold">About us</span>
                </div>
            </div>
            {/* HERO SECTION */}
             {/* <section className="bg-gradient-to-r from-[#f5f8ff] to-white py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                      
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Tamil Nadu's</p>
                            <h1 className="text-3xl font-bold leading-tight text-[#0a1d56]">Most Trusted <br />Electronics Destination</h1>
                            <h2 className="text-3xl font-bold text-[#2453d3] mt-2">Since 2000</h2>
                            <p className="mt-1 text-gray-600 leading-8">From our first electronics showroom in Coimbatore in 2000 to 47+ stores across Tamil Nadu, Bharath Electronics & Appliances (BEA) has growth into one of Tamil Nadu's most trusted destination for home appliances, electronics and smart living solutions.</p>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => router.push("/location")}  className="bg-[#2453d3] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#1d45b8] transition">
                                    <FiMapPin size={18} />
                                    Explore Our Stores
                                </button>
                                <button onClick={() => router.push("/")} className="border border-[#2453d3] text-[#2453d3] px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#2453d3] hover:text-white transition">
                                    <FiShoppingCart size={18} />
                                    Shop Now
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <Image src="/uploads/aboutus-banner.png" width={900} height={650} alt="BEA Store" className="rounded-2xl shadow-2xl w-full"/>
                        </div>
                    </div>
                </div>
            </section>  */}
<section className="w-full">
    {/* Desktop/Laptop - overlay layout */}
    <div className="relative w-full hidden lg:block">
        <Image 
            src="/uploads/aboutus-banner1.png" 
            width={1920}
            height={650}
            alt="BEA Store" 
            className="w-full h-auto object-cover"
            priority
        />
        <div className="absolute inset-0 flex items-center">
            <div className="w-[32%] pl-8 lg:pl-12">
                <p className="text-sm text-gray-500 mb-1">Tamil Nadu's</p>
                <h1 className="text-2xl lg:text-3xl font-bold leading-tight text-[#0a1d56]">Most Trusted <br />Electronics Destination</h1>
                <h2 className="text-2xl lg:text-3xl font-bold text-[#2453d3] mt-2">Since 2000</h2>
                <p className="mt-2 text-gray-600 text-sm leading-7">From our first showroom in Coimbatore in 2000 to 47+ stores across Tamil Nadu, BEA has grown into Tamil Nadu's most trusted destination for home appliances & electronics.</p>
                <div className="flex flex-wrap gap-3 mt-6">
                    <button onClick={() => router.push("/location")} className="bg-[#2453d3] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#1d45b8] transition">
                        <FiMapPin size={16} />
                        Explore Our Stores
                    </button>
                    <button onClick={() => router.push("/")} className="border border-[#2453d3] text-[#2453d3] px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#2453d3] hover:text-white transition">
                        <FiShoppingCart size={16} />
                        Shop Now
                    </button>
                </div>
            </div>
        </div>
    </div>

    {/* Tablet/Mobile - stacked layout */}
    <div className="lg:hidden">
        <Image 
            src="/uploads/aboutus-banner.png" 
            width={1920}
            height={650}
            alt="BEA Store" 
            className="w-full h-auto object-cover"
            priority
        />
        <div className="px-6 py-10 bg-gradient-to-b from-[#f5f8ff] to-white">
            <p className="text-sm text-gray-500 mb-1">Tamil Nadu's</p>
            <h1 className="text-2xl font-bold leading-tight text-[#0a1d56]">Most Trusted <br />Electronics Destination</h1>
            <h2 className="text-2xl font-bold text-[#2453d3] mt-2">Since 2000</h2>
            <p className="mt-2 text-gray-600 text-sm leading-7">From our first showroom in Coimbatore in 2000 to 47+ stores across Tamil Nadu, BEA has grown into Tamil Nadu's most trusted destination for home appliances & electronics.</p>
            <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={() => router.push("/location")} className="bg-[#2453d3] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#1d45b8] transition">
                    <FiMapPin size={16} />
                    Explore Our Stores
                </button>
                <button onClick={() => router.push("/")} className="border border-[#2453d3] text-[#2453d3] px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#2453d3] hover:text-white transition">
                    <FiShoppingCart size={16} />
                    Shop Now
                </button>
            </div>
        </div>
    </div>
</section>
            {/* Statistics Bar */}
            <section className="-mt-8 relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-white rounded-2xl shadow-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                            {[{
                                count: "25+",
                                label: (<>Years of <br />Excellence</>),
                                icon: <FiAward size={32} className="text-[#2453d3]" />
                            },
                            {
                                count: "47+",
                                label: (<>Showrooms <br />Across Tamil Nadu </>),
                                icon: <FiHome size={32} className="text-[#2453d3]" />
                            },
                            {
                                count: "17+",
                                label: (<>Cities <br /> We Serve</>),
                                icon: <FiMapPin size={32} className="text-[#2453d3]" />
                            },
                            {
                                count: "50 Lakh+",
                                label: (<>Happy <br /> Customers</>),
                                icon: <FiUsers size={32} className="text-[#2453d3]" />
                            },
                            {
                                count: "30+",
                                label: (<>Leading <br />Brand Partners</>),
                                icon: <FiBriefcase size={32} className="text-[#2453d3]" />
                            },
                            {
                                count: "5000+",
                                label: (<>Products <br /> Across Categories</>),
                                icon: <FiPackage size={32} className="text-[#2453d3]" />
                            },].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 px-4 py-0 ${ i !== 5 ? "lg:border-r border-gray-200" : ""}`}>
                                    {/* Left Icon */}
                                    <div className="flex-shrink-0">{item.icon}</div>
                                    {/* Right Content */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#2453d3]">{item.count}</h3>
                                        <p className="text-gray-600 text-sm leading-5">{item.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            {/* Why Choose BEA */}
            <section className="py-6 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[#2b3a79]">Why Customers Choose BEA?</h2>
                        <div className="w-12 h-1 bg-[#2453d3] mx-auto mt-2 rounded-full"></div>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {chooseData.map((item, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300">
                                {/* Image */}
                                <div className="relative">
                                    <img src={item.image} alt={item.title} className="w-full h-28 object-cover"/>
                                    {/* Floating Icon */}
                                    <div className="absolute -bottom-4 left-4 w-9 h-9 rounded-full bg-white border-2 border-[#2453d3] flex items-center justify-center text-[#2453d3] shadow-md">{item.icon}</div>
                                </div>

                                {/* Content */}
                                <div className="pt-7 px-3 pb-4 text-center">
                                    <h3 className="font-bold text-[#2b3a79] text-sm leading-5 min-h-[40px]">{item.title}</h3>
                                    <p className="text-[12px] text-gray-600 mt-1 leading-5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* Store Experience Section */}
            <section className="pb-8 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-5">
                        <h2 className="text-2xl font-bold text-[#2b3a79]">Experience BEA Stores</h2>
                        <div className="w-12 h-1 bg-[#2453d3] mx-auto mt-2 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                    {storeExperience.map((item, i) => (
                        <div
                        key={i}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                        >

                        {/* Image */}
                        <div className="overflow-hidden">
                            <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-20 object-cover hover:scale-105 transition duration-300"
                            />
                        </div>

                        {/* Title */}
                        <div className="py-2 px-2">
                            <h3 className="text-[12px] font-semibold text-center text-[#2b3a79] leading-4">
                            {item.title}
                            </h3>
                        </div>

                        </div>
                    ))}

                    </div>
                </div>
            </section>
            {/* Company Journey Timeline */}
            <section className="py-12">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Row 1 */}
                   <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-5 mb-5">
                        {/* Journey */}
                        <div className="bg-white rounded-2xl p-6 border shadow-sm">
                            <h2 className="text-2xl font-bold text-[#1f3bb3] mb-8">Our Journey</h2>
                            <div className="relative">
                                {/* Connecting Line */}
                               <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400"></div>
                               <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
                                    {[
                                        {
                                            year: "2000",
                                            title: "Our First Store",
                                            desc: "Started our journey With the first BEA showroom in Coimbatore.",
                                            icon: <FiHome size={22} />,
                                            color: "bg-blue-500",
                                        },
                                        {
                                            year: "2005",
                                            title: "Expanding Presence",
                                            desc: "Opened multiple showrooms in key cities across TN.",
                                            icon: <FiBriefcase size={22} />,
                                            color: "bg-orange-500",
                                        },
                                        {
                                            year: "2010",
                                            title: "Growing Strong",
                                            desc: "Expanded to more location and became a trusted retail name.",
                                            icon: <FiTrendingUp size={22} />,
                                            color: "bg-green-500",
                                        },
                                        {
                                            year: "2015",
                                            title: "Customer Trust Milestone",
                                            desc: "Crossed 20+ stores and millions of happy customers.",
                                            icon: <FiAward size={22} />,
                                            color: "bg-purple-500",
                                        },
                                        {
                                            year: "2020",
                                            title: "Digital Transformation",
                                            desc: "Enhanced Online presence & better customer experience.",
                                            icon: <FiMapPin size={22} />,
                                            color: "bg-blue-600",
                                        },
                                        {
                                            year: "2025",
                                            title: "Silver Jubilee",
                                            desc: "Celebrating 25 years of trust, service and innovation.",
                                            icon:  <FiGift size={22} />,
                                            color: "bg-orange-500",
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="text-center">
                                            <div className={`w-14 h-14 mx-auto rounded-full ${item.color} border-4 border-white shadow-lg flex items-center justify-center text-white`}>
                                                {item.icon}
                                            </div>
                                            <h4 className="text-[#1f3bb3] font-bold mt-3">{item.year}</h4>
                                            <p className="text-[12px] font-semibold">{item.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Vision */}
                        <div className="bg-[#f7f9ff] rounded-xl border overflow-hidden">
                        <div className="grid grid-cols-[1fr_120px] sm:grid-cols-[1fr_170px] h-full">
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-[#2b3a79] mb-3">The Vision Behind BEA</h3>
                                    <p className="text-[13px] text-gray-600 leading-6">Founded by R. Raja Ravichandran in 2000, BEA started with a vision to bring world-class electronics and appliances closer to every home.</p>
                                    <p className="text-[13px] text-gray-600 leading-6 mt-3">Today, under the next generation leadership, we continue our journey combining trust, technology and customer experience.</p>
                                    <div className="mt-5">
                                        <p className="font-semibold text-[#1f3bb3]">R. Raja Ravichandran</p>
                                        <p className="text-xs text-gray-500">Founder</p>
                                    </div>
                                </div>
                                <img src="/uploads/visio_n.png" alt="" className="h-full w-full object-cover"/>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        {/* Tamil Nadu */}
                        <div className="bg-[#f7f9ff] rounded-xl border border-gray-200 p-2">
                            <h3 className="text-xl font-bold text-[#1f3bb3] mb-1">BEA Across Tamil Nadu</h3>
                            <p className="text-sm text-gray-600 mb-4">Serving customers across</p>
                           <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-start">
                                {/* Locations */}
                                <div>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Coimbatore
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Salem
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Erode
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Tirupur
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Namakkal
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Trichy
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Dharmapuri
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#2453d3]">📍</span>Krishnagiri
                                        </li>

                                        <li className="text-[#2453d3] font-medium text-sm pt-1">
                                            <a href="/location">and many more...</a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Map */}
                                <div className="flex justify-center">
                                <img src="/uploads/aboutus-map.png" alt="BEA Across Tamil Nadu" className="w-full max-w-[280px] object-contain" />
                                          </div>
                            </div>
                        </div>
                        {/* Brand Partners */}
                        <div className="bg-white rounded-2xl border shadow-sm p-6">
                            <h3 className="text-2xl font-bold text-[#1f3bb3] mb-2">Our Premium Brand Partners</h3>
                            <p className="text-gray-500 text-sm mb-5">BEA brings together the world's leading electronics and home appliance brands under one roof.</p>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                {brands.map((logo, i) => (
                                    <div key={i} className="h-16 bg-white border rounded-xl flex items-center justify-center hover:shadow-md transition">
                                        <img src={logo} alt="" className="max-h-8 object-contain"/>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mt-6">
                                <button className="bg-[#1f3bb3] text-white px-6 py-2 rounded-lg">View All Brands →</button>
                            </div>
                        </div>
                    </div>
                    {/* Row 3 */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Team Banner */}
                        <div className="relative rounded-2xl overflow-hidden ">
                            <img src="/uploads/47_store.png" alt="" className="w-full h-[300px] object-fill"/>

                            <div className="absolute inset-0 bg-gradient-to-r from-[#001854] to-transparent"></div>

                            <div className="absolute left-6 top-6 text-white max-w-md ">
                            <h3 className="text-3xl font-bold mb-2">
                                Built on Trust. Driven by People.
                            </h3>

                            <p className="text-sm">
                                Meet the people behind BEA who believe
                                in customer happiness, innovation and excellence.
                            </p>
                            </div>
                        </div>
                        {/* Testimonials */}
                        <div className="bg-[#f7f9ff] rounded-2xl border shadow-sm p-3">
                            <h3 className="text-xl font-bold text-center text-[#2b3a79] mb-6">What Our Customers Say</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    {
                                        name: "Ramesh Kumar",
                                        city: "Coimbatore",
                                        review: "Best place to buy electronics.",
                                        image: "/uploads/user1.jpg",
                                    },
                                    {
                                        name: "Priya Natarajan",
                                        city: "Chennai",
                                        review: "Wide range of products.",
                                        image: "/uploads/user2.jpg",
                                    },
                                    {
                                        name: "Karthik Vel",
                                        city: "Madurai",
                                        review: "Finance options are easy.",
                                        image: "/uploads/user3.jpg",
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="border rounded-xl p-4 hover:shadow-md transition">
                                        <div className="text-yellow-500 mb-2 text-lg">★★★★★</div>
                                        <p className="text-sm text-gray-600 mb-5">"{item.review}"</p>
                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            {/* Option 1: User Image
                                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover border" /> */}

                                            {/* Option 2: If no image, use icon */}
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#1f3bb3]">
                                                <FiUser size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#1f3bb3] text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">📍 {item.city}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
