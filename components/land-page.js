import React, {useState, useEffect, useRef, useContext} from 'react';
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation, Autoplay } from 'swiper/modules';


export default function LandComponent() {

    const defaultImages = [
        { id: 1, image: "/images/Coffee-Maker.webp" },
        { id: 2, image: "/images/Coffee-Maker.webp" },
        { id: 3, image: "/images/Coffee-Maker.webp" },
        { id: 4, image: "/images/Coffee-Maker.webp" },
        { id: 5, image: "/images/Coffee-Maker.webp" },
        { id: 6, image: "/images/Coffee-Maker.webp" },
        { id: 7, image: "/images/Coffee-Maker.webp" },
        { id: 8, image: "/images/Coffee-Maker.webp" },
    ];

    const categories = [
        { id: 1, name: "Refrigerators", image: "/images/test_img.png" },
        { id: 2, name: "Microwave Ovens", image: "/images/test_img.png" },
        { id: 3, name: "Air Conditioners", image: "/images/test_img.png" },
        { id: 4, name: "Smartphones", image: "/images/test_img.png" },
        { id: 5, name: "Laptops", image: "/images/test_img.png" },
        { id: 6, name: "Washing Machines", image: "/images/test_img.png" },
        { id: 7, name: "Bluetooth Speakers", image: "/images/test_img.png" },
        { id: 8, name: "Smart Watches", image: "/images/test_img.png" },
        { id: 9, name: "Vacuum Cleaners", image: "/images/test_img.png" },
        { id: 10, name: "Gaming Consoles", image: "/images/test_img.png" },
    ];

    const products = [
        {
            id: 1,
            name: "Bosch Series 4",
            model: "Free Standing Dishwasher",
            image: "/images/Bosch-series.png",
            price: 38490,
            discount: 6500,
        },
        {
            id: 2,
            name: "IFB Neptune VX1",
            model: "15 Place Settings",
            image: "/images/Bosch-series.png",
            price: 37490,
            discount: 5500,
        },
         {
            id: 3,
            name: "Bosch Series 4",
            model: "Free Standing Dishwasher",
            image: "/images/Bosch-series.png",
            price: 38490,
            discount: 6500,
        },
        {
            id: 4,
            name: "IFB Neptune VX1",
            model: "15 Place Settings",
            image: "/images/Bosch-series.png",
            price: 37490,
            discount: 5500,
        },
         {
            id: 5,
            name: "Bosch Series 4",
            model: "Free Standing Dishwasher",
            image: "/images/Bosch-series.png",
            price: 38490,
            discount: 6500,
        },
        {
            id: 6,
            name: "IFB Neptune VX1",
            model: "15 Place Settings",
            image: "/images/Bosch-series.png",
            price: 37490,
            discount: 5500,
        },
        {
            id: 7,
            name: "Bosch Series 4",
            model: "Free Standing Dishwasher",
            image: "/images/Bosch-series.png",
            price: 38490,
            discount: 6500,
        },
        {
            id: 8,
            name: "IFB Neptune VX1",
            model: "15 Place Settings",
            image: "/images/Bosch-series.png",
            price: 37490,
            discount: 5500,
        },
        
    ];


    return (
        <>
            <main className="bg-white min-h-screen px-4 md:px-6 py-8">
                {/* ===== Categories Banner ===== */}
                <section className="px-4 md:px-6">
                    <Swiper modules={[Navigation, Autoplay]} spaceBetween={20} speed={1000} slidesPerView={2} autoplay={{ delay: 5000, disableOnInteraction: true, }} breakpoints={{ 426: { slidesPerView: 1 }, 1024: { slidesPerView: 1 } }} >
                        {categories.map((cat) => (
                            <SwiperSlide key={cat.id}>
                                <div className="w-full text-white to-gray-800 rounded-2xl shadow-md text-center">
                                    <div className="h-[250] relative mb-2">
                                        <Image src="/images/test_banner_2.webp" alt={cat.name} fill className="object-contain rounded-lg" />
                                    </div>
                                    {/* <p className="text-lg font-medium">{cat.name}</p> */}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>

                {/* ===== Categories Slider ===== */}
                <section className="px-4 md:px-6 py-4">
                    <h2 className="text-center text-2xl font-semibold mb-6">Categories</h2>
                    <Swiper modules={[Navigation]} spaceBetween={20} speed={600} slidesPerView={2} breakpoints={{ 280: { slidesPerView: 3 }, 426: { slidesPerView: 4 }, 1024: { slidesPerView: 5 }, }} >
                        {categories.map((cat) => (
                            <SwiperSlide key={cat.id}>
                                <div className="w-full text-white bg-gradient-to-b from-gray-600 to-gray-800 rounded-2xl shadow-md text-center">
                                    <div className="h-[180] relative mb-2">
                                        <Image src={cat.image} alt={cat.name} style={{ objectFit: 'fill' }} fill className="object-contain rounded-lg"
                                        />
                                    </div>
                                    {/* <p className="text-lg font-medium">{cat.name}</p> */}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>

                {/* ===== Default 4-Image Section ===== */}
                <section className="py-10 bg-gray-50 px-4 md:px-6 py-4">
                    <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-center text-2xl font-semibold mb-8">
                        Blend and Grind Magic
                    </h2>
                    
                    <Swiper modules={[Navigation]} spaceBetween={20} speed={600} slidesPerView={2} breakpoints={{ 280: { slidesPerView: 3 }, 426: { slidesPerView: 5 }, 1024: { slidesPerView: 7 }, }} >
                        {defaultImages.map((item) => (
                            <SwiperSlide key={item.id}>
                                <div className="w-[120px] text-white bg-gradient-to-b from-gray-100 to-gray-600 rounded-[50%] shadow-md text-center">
                                    <div className="h-[115px] relative mb-2">
                                        <Image src={item.image} alt="image" style={{ objectFit: 'fill' }} fill className="object-contain rounded-[50%] w-[120px] h-[115px]" />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    </div>
                </section>

                {/* ===== Product Slider ===== */}
                <section className="px-4 md:px-6 pt-6">
                    {/* <h2 className="text-center text-2xl font-semibold mt-3 mb-4">Dish Washer</h2> */}
                    <Swiper modules={[Navigation, Autoplay]} spaceBetween={20} speed={1000} slidesPerView={2} autoplay={{ delay: 5000, disableOnInteraction: true, }} breakpoints={{ 426: { slidesPerView: 1 }, 1024: { slidesPerView: 1 } }} >
                        {categories.map((cat) => (
                            <SwiperSlide key={cat.id}>
                                <div className="w-full text-white to-gray-800 shadow-md text-center">
                                    <div className="h-[250] relative">
                                        <Image src="/images/Redefining.webp" alt={cat.name} fill className="object-contain " />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>

                {/* ===== other Banner ===== */}
                <section className="px-4 md:px-6 pb-4">
                    {/* <h2 className="text-center text-2xl font-semibold mb-6">Dish Washer</h2> */}
                    <Swiper className='bg-gray-50' modules={[Navigation]} spaceBetween={0} speed={600} slidesPerView={2} navigation breakpoints={{ 280: { slidesPerView: 2 }, 426: { slidesPerView: 3 }, 768: { slidesPerView: 5 }, 1024: { slidesPerView: 6 }, }}>
                        {products.map((item) => (
                            <SwiperSlide key={item.id} className='pt-2'>
                                <div className="bg-gray-50 px-3 py-3 text-center border-r border-gray-300">
                                    <div className="relative h-[140px] mb-3">
                                        <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-contain rounded-md"
                                        style={{ objectFit: 'contain' }}
                                        />
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800">{item.name}</h3>
                                    <p className="text-xs text-gray-600">{item.model}</p>
                                    <p className="text-lg font-bold text-red-600 mt-1">₹{item.price}</p>
                                    <p className="text-xs text-green-600">Save ₹{item.discount}</p>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>

            </main>
        </>
    );
}

