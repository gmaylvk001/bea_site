"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { FiTruck, FiCalendar, FiMail, FiPhone } from 'react-icons/fi';
import { MdOutlineLocalShipping } from "react-icons/md";

const ShippingPolicy = () => {
  const [currentDate, setCurrentDate] = useState('');
  
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  return (
    <div>
      {/* Header Bar */}
      <div className="bg-blue-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Shipping & Delivery Policy</h2>
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-gray-600 hover:text-blue-600">🏠 Home</Link>
          <span className="text-gray-500">›</span>
          <span className="text-blue-600 font-semibold">Shipping Policy</span>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-9xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTruck className="text-blue-600 text-3xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-customBlue mb-4">Shipping & Delivery Policy</h1>
            {currentDate && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Last updated: {currentDate}
              </p>
            )}
          </div>

          {/* Policy Content */}
          <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Shipping Methods */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-customBlue mb-4 flex items-center gap-2">
                <MdOutlineLocalShipping className="text-customBlue" /> Shipping Methods
              </h2>
              <p className="text-gray-600 mb-4">
                For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only.
              </p>
              <p className="text-gray-600">
                Orders are shipped within 3-5 days or as per the delivery date agreed at the time of order confirmation and delivery of the shipment subject to Courier Company / post office norms.
              </p>
            </div>

            {/* Delivery Timeline */}
            <div className="p-8 border-b border-gray-100 bg-blue-50/30">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiCalendar className="text-2xl" />
                Delivery Timeline
              </h3>
              <p className="text-gray-600">
                Bharath Electronics and Appliances is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within 3-5 days from the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
              </p>
            </div>

            {/* Delivery Address */}
            <div className="p-8">
              <h3 className="text-xl font-semibold text-customBlue mb-3 flex items-center gap-2">
                <FiMail className="text-customBlue" />
                Delivery Information
              </h3>
              <p className="text-gray-600 mb-4">
                Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration.
              </p>
              <p className="text-gray-600 mb-6">
                For any issues in utilizing our services, you may contact our helpdesk:
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="tel:9842344323" 
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                >
                  <FiPhone /> 9842344323
                </a>
                <a 
                  href="mailto:customercare@bharathelectronics.in" 
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
                >
                  <FiMail /> customercare@bharathelectronics.in
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;