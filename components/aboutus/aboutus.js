'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BsFillAwardFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { GiNetworkBars } from "react-icons/gi";
import { FaThumbsUp } from "react-icons/fa";
import { FiHeadphones,  FiSettings,FiTag, FiTarget, FiMapPin, FiAward, FiUsers,FiUser,  FiMonitor, FiSpeaker, FiShoppingCart, FiStar } from 'react-icons/fi';




const AboutUs = () => {


  return (
    <div className="text-[#1d1d1f]">

         {/* 🟠 About us Header Bar */}
              <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">About us</h2>
                <div className="flex items-center space-x-2">
                  <Link href="/" className="text-gray-600 hover:text-blue-600">🏠 Home</Link>
                  <span className="text-gray-500">›</span>
                  <span className="text-blue-600 font-semibold">About us</span>
                </div>
              </div>
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-200 blur-3xl"></div>
                <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-indigo-200 blur-3xl"></div>
            </div>
    
            {/* Floating electronics icons */}
            <FiMonitor className="absolute top-20 left-10 text-blue-100 text-6xl animate-float-slow" />
            <FiSpeaker className="absolute bottom-20 right-10 text-indigo-100 text-5xl animate-float-slow-delay" />
    
            <div className="relative z-10 max-w-5xl mx-auto px-6">
                {/* Animated title */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gray-800 animate-fade-in-up text-center">
            <span className="relative inline-block">
                House of Consumer Electronics
            </span>
            <br />
            <span className="text-customBlue inline-block mt-2">
                &amp; Home Appliances
            </span>
            </h1>

                
                {/* Animated description */}
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in-up delay-100">
                <span className="font-semibold text-gray-700">BEA (Bharath Electronics Appliances)</span> is the premier chain of consumer electronics & home appliances in Tamil Nadu with over{" "}
                <span className="relative inline-block font-bold text-customBlue">
                    26 Multi-branded stores
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-200/50"></span>
                </span>.
                </p>
                
                {/* Animated button with floating effect */}
                <div className="animate-bounce-in delay-300 text-center">
                <Link 
                    href="#" 
                    className="relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-medium text-white bg-gradient-to-r from-customBlue to-blue-600 rounded-lg group shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                    <span className="relative z-10 flex items-center">
                    Shop Now
                    <FiShoppingCart className="ml-2" />
                    </span>
                    <span className="absolute -bottom-0 -right-0 w-full h-10 bg-blue-700 opacity-10 group-hover:w-0 group-hover:h-0 transition-all duration-500"></span>
                    <span className="absolute -top-0 -left-0 w-10 h-10 bg-white opacity-10 group-hover:w-60 group-hover:h-60 group-hover:opacity-0 rounded-full transition-all duration-700"></span>
                </Link>
                </div>
                
            
            </div>
      </section>

      {/* Our Key to Success Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Animated Header */}
            <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-customBlue mb-6 relative">
                <span className="relative z-10">Our Key to Success </span>
                <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-blue-200 animate-underline-expand"></span>
            </h2>
            
            <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto mb-8">
                The perfect blend of <span className="font-semibold text-blue-600">quality</span>, <span className="font-semibold text-blue-600">service</span>, and <span className="font-semibold text-blue-600">value</span> that keeps customers coming back
            </p>
            </div>

            {/* Success Pillars - Animated Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
                {
                icon: <FiAward className="text-3xl text-blue-600" />,
                title: "Premium Products",
                desc: "Only the finest quality electronics from trusted global brands"
                },
                {
                icon: <FiHeadphones className="text-3xl text-blue-600" />,
                title: "Exceptional Service",
                desc: "24/7 customer support with knowledgeable representatives"
                },
                {
                icon: <FiSettings className="text-3xl text-blue-600" />,
                title: "After-Sales Care",
                desc: "Comprehensive warranty and maintenance services"
                },
                {
                icon: <FiTag className="text-3xl text-blue-600" />,
                title: "Fair Pricing",
                desc: "Competitive value-based pricing with no hidden costs"
                },
                {
                icon: <FiUsers className="text-3xl text-blue-600" />,
                title: "Friendly Staff",
                desc: "Well-trained, customer-first employees ready to assist"
                },
                {
                icon: <FiMapPin className="text-3xl text-blue-600" />,
                title: "Prime Locations",
                desc: "Modern showrooms with excellent accessibility"
                }
            ].map((item, index) => (
                <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-white hover:border-blue-100 animate-card-enter"
                style={{ animationDelay: `${index * 0.1}s` }}
                >
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
                    {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
                </div>
            ))}
            </div>

        
        </div>
      </section>


      {/* Mission + BEA Stores Combined Section */}
      <section className="py-20 relative overflow-hidden  bg-gradient-to-br from-blue-50 to-indigo-50" style={{ backgroundColor: '#f0f4ff' }}>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute bottom-10 right-20 w-60 h-60 rounded-full bg-indigo-300 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center px-6 relative z-10">
            {/* Content Column */}
            <div className="space-y-10 animate-fade-in-up">
            {/* Mission Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm transform transition-all hover:scale-[1.01] hover:shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                    <FiTarget className="text-blue-600 text-2xl" />
                </div>
                <h2 className="text-3xl font-bold text-customBlue">Our Mission</h2>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                    To expand our branches across Tamil Nadu while delivering an unparalleled shopping experience that combines convenience, quality, and exceptional service.
                </p>
                <p className="bg-blue-50/50 p-4 rounded-lg border-l-4 border-blue-400 italic">
                    "Well-located showrooms with premium infrastructure make it effortless for customers to discover and enjoy our offerings."
                </p>
                </div>
            </div>

            {/* Presence Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-white/20 backdrop-blur-sm transform transition-all hover:scale-[1.01] hover:shadow-2xl animate-fade-in-up delay-100">
                <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-full">
                    <FiMapPin className="text-blue-600 text-2xl" />
                </div>
                <h2 className="text-3xl font-bold text-customBlue">BEA's Tamil Nadu Presence</h2>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                    <span className="font-semibold text-blue-600">34 branches</span> strong - 26 Multi-brand stores and 8 exclusive Brand outlets across the state.
                </p>
                
                
                
                <p className="pt-4">
                    From our first store in <span className="font-semibold">Coimbatore (2000)</span> to our newest branches, we continue to set industry standards with crowd-favorite offers and services.
                </p>
                </div>
            </div>
            </div>

            {/* Image Column */}
            <div className="relative animate-fade-in-up delay-200">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform transition-all hover:scale-[1.02]">
                <Image 
                src="/user/bea.webp" 
                alt="BEA Storefront" 
                width={600} 
                height={500} 
                className="w-full h-auto object-cover"
                priority
                />
                {/* Decorative frame */}
                <div className="absolute inset-0 border-8 border-white/30 pointer-events-none"></div>
            </div>
            
            {/* Stats overlay */}
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 w-64">
                <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">34+</div>
                <p className="text-sm uppercase tracking-wider text-gray-600 font-medium">Branches</p>
                <div className="mt-3 w-full bg-blue-100 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-progress-grow"></div>
                </div>
                </div>
            </div>
            
            {/* Anniversary badge */}
            <div className="absolute -top-5 -left-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center animate-float-slow">
                <FiAward className="mr-2" />
                <span className="text-sm font-medium">22 Years Excellence</span>
            </div>
            </div>
        </div>
      </section>

      {/* Brands + Awards + Team + Turnover + Key to Success Combined Section */}
      <section className="py-16 bg-white overflow-hidden  bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Brands Section with Floating Animation */}
            <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-customBlue mb-6">
                <span className="inline-block relative">
                <span className="relative z-10">Our Premium Brands</span>
                <span className="absolute bottom-0 left-0 w-full h-2 bg-blue-100/70 -z-0 animate-underline-expand"></span>
                </span>
            </h2>
            
            <div className="relative max-w-4xl mx-auto">
                <p className="text-gray-700 mb-8 leading-relaxed animate-fade-in-up delay-100">
                BEA sells leading Brands in Consumer Electronics and Home Appliances like Sony, LG, Samsung, Philips, Bosch, Godrej, Bajaj, Onida, Whirlpool, Panasonic, Haier, Siemens, Crompton, V Guard, Ultra, Eureka, AO-Smith, Preethi, Butterfly, O-general, Daikin, Voltas and Carrier, Hitachi, Faber, Kent are available for best price possible in the industry
                </p>
                
                <p className="text-gray-700 leading-relaxed animate-fade-in-up delay-200">
                Moreover, BEA has the best disciplined industry with latest technology products like LED TV, 4K LED TV, OLED TV, QLED TV, curved TV, Side by Side Refrigerator, Single Door Refrigerator, Double Door Refrigerator, Top Load Washing Machine, Frontload Washing Machine, Semi-Automatic Washing Machine, Dishwasher are displayed in the wide range.
                </p>
                
                {/* Floating brand logos (visual representation) */}
                <div className="absolute -top-10 -left-10 w-20 h-20 rounded-full bg-blue-50/50 animate-float-slow"></div>
                <div className="absolute -bottom-5 -right-5 w-16 h-16 rounded-full bg-orange-50/50 animate-float-slow-delay"></div>
            </div>
            </div>

            {/* Grid Section with Animated Cards */}
        <div className="grid md:grid-cols-2 gap-8">
        {[ // All 4 cards in a single array for symmetrical layout
            {
            icon: <BsFillAwardFill className="text-yellow-500 text-2xl" />,
            title: 'Awards & Recognition',
            content: 'Awarded Number one in performance in our area many times by most of the world admired brands we deal. Marketing done regularly through leading newspapers, satellite channels, local cables, hoardings, flex displays, theatres, SMS blasting, and of course on all social media like Facebook, WhatsApp, Twitter, Instagram, etc.',
            delay: ''
            },
            {
            icon: <GiNetworkBars className="text-yellow-500 text-2xl" />,
            title: 'Remarkable Sales Growth',
            content: 'Started with ₹5 Cr in the first year and achieved a tremendous turnover of nearly ₹300 Cr in just 17 years. BEA caters to all customer needs in consumer electronics & home appliances — and now, BEA has also started its online business through their official website for customer convenience.',
            delay: 'delay-100'
            },
            {
            icon: <FaUserGroup className="text-yellow-500 text-2xl" />,
            title: 'Dedicated Team',
            content: 'A separate team is dedicated to promoting institutional/bulk orders for hospitals, hotels, apartments, government & private sectors, factories. Our major clients include PRICOL, LMW, Lakshmi Mills, Sharp, KSB Pumps, Daksha Properties, KMCH, GEM, Lotus Hospitals & many more.',
            delay: 'delay-200'
            },
            {
            icon: <FaThumbsUp className="text-yellow-500 text-2xl" />,
            title: 'Our Success Formula',
            content: 'The key to success, according to BEA: Best Showrooms, Best Service, Best Price, Best Products, Best Brands, and Best Hospitality. Attractive finance schemes with EMI options are available for customer convenience. After-sales service is handled by a well-experienced support team.',
            delay: 'delay-300'
            }
        ].map(({ icon, title, content, delay }, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 animate-card-enter ${delay} flex flex-col justify-between`}>
            <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full animate-pulse-slow">{icon}</div>
                <div>
                <h3 className="text-xl font-bold text-customBlue mb-3">{title}</h3>
                <p className="text-gray-700 leading-relaxed">{content}</p>
                </div>
            </div>
            </div>
        ))}
        </div>
        </div>
      </section>
      
      
      <section className="relative min-h-[700px] w-full overflow-hidden">
            {/* Blue-tinted Background Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                src="/user/ambassador.jpg"
                alt="Happy Customers Across TamilNadu"
                layout="fill"
                objectFit="cover"
                className="object-cover"
                priority
                />
            
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col items-end justify-center max-w-7xl mx-auto px-6 pt-32 pb-20">
                
                {/* Customer Count - Right-Aligned Blue Theme */}
                <div className="w-full max-w-xl mb-12 relative group ml-auto">
                {/* Floating bubbles (blue version) */}
                <div className="absolute -top-5 -left-5 w-10 h-10 rounded-full bg-sky-400/30 animate-float"></div>
                <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-blue-500/30 animate-float-delay"></div>
                
                <div className="relative bg-slate-800/70 backdrop-blur-lg border-l-4 border-sky-400 rounded-r-2xl rounded-l-none p-8 shadow-2xl overflow-hidden text-left">
                    {/* Animated blue shine */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-shine"></div>
                    
                    <p className="text-2xl md:text-3xl font-medium leading-snug text-white">
                    Trusted by over {" "}
                    <span className="font-bold text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600">
                        50 Lakh
                    </span>{" "}
                    happy customers across TamilNadu
                    </p>
                    
                    {/* Sparkle icon (blue tint) */}
                    <div className="absolute -bottom-4 -right-4 text-5xl opacity-20 text-sky-300">
                    ✨
                    </div>
                </div>
                </div>

                {/* Stats Grid - Blue Theme */}
                <div className="flex flex-col items-end w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
                    {/* Branches Card - Blue Gradient */}
                    <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-2xl shadow-lg border border-sky-400/20 transform transition-all hover:scale-[1.02] hover:shadow-xl">
                    <div className="flex flex-col items-center">
                        <div className="text-6xl font-bold mb-2 text-sky-300 drop-shadow-md">38</div>
                        <p className="text-lg uppercase tracking-widest font-medium text-sky-200">Branches</p>
                        <div className="mt-4 w-full bg-blue-800/40 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-400 to-blue-400 animate-progress" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                    </div>

                    {/* Cities Card - Blue/White */}
                    <div className="bg-gradient-to-br from-white to-gray-100 p-8 rounded-2xl shadow-lg border border-blue-200/30 transform transition-all hover:scale-[1.02] hover:shadow-xl">
                    <div className="flex flex-col items-center">
                        <div className="text-6xl font-bold mb-2 text-blue-600 drop-shadow-sm">17</div>
                        <p className="text-lg uppercase tracking-widest font-medium text-blue-800">Cities</p>
                        <div className="mt-4 w-full bg-blue-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-sky-500 animate-progress-delay" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
      </section>
</div>
  );
};

export default AboutUs;
