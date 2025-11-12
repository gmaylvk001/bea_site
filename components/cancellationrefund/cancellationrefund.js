"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { FiRotateCcw, FiPackage, FiCheckCircle, FiClock } from 'react-icons/fi';
import { MdOutlinePolicy, MdOutlineMoneyOff } from "react-icons/md";

const CancellationRefundPolicy = () => {
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
        <h2 className="text-xl font-bold text-gray-800">Cancellation & Refund Policy</h2>
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-gray-600 hover:text-blue-600">🏠 Home</Link>
          <span className="text-gray-500">›</span>
          <span className="text-blue-600 font-semibold">Cancellation & Refund</span>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-9xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiRotateCcw className="text-blue-600 text-3xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-customBlue mb-4">Cancellation & Refund Policy</h1>
            {currentDate && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Last updated: {currentDate}
              </p>
            )}
          </div>

          {/* Policy Content */}
          <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Cancellation Policy */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-customBlue mb-4 flex items-center gap-2">
                <MdOutlinePolicy className="text-customBlue" /> Cancellation Policy
              </h2>
              <p className="text-gray-600 mb-4">
                Cancellations will be considered only if the request is made immediately after placing the order: however, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initated the process of shipping them.
              </p>
              <p className="text-gray-600">
                Bharath Electronics and Appliances does not accept cancellation requests for perishable items etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.
              </p>
            </div>

            {/* Damaged/Defective Items */}
            <div className="p-8 border-b border-gray-100 bg-blue-50/30">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiPackage className="text-2xl" />
                Damaged or Defective Items
              </h3>
              <p className="text-gray-600">
                In case of receipt of damaged or defective items, please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within 7 days of receipt of the products.
              </p>
            </div>

            {/* Product Complaints */}
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiCheckCircle className="text-2xl" />
                Product Complaints
              </h3>
              <p className="text-gray-600">
                In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within 7 days of receiving the product. The Customer Service Team, after looking into your complaint will take an appropirate decision.
              </p>
            </div>

            {/* Warranty Items */}
            <div className="p-8 border-b border-gray-100 bg-blue-50/30">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiPackage className="text-2xl" />
                Warranty Products
              </h3>
              <p className="text-gray-600">
                In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.
              </p>
            </div>

            {/* Refund Processing */}
            <div className="p-8">
              <h3 className="text-xl font-semibold text-customBlue mb-3 flex items-center gap-2">
                <FiClock className="text-customBlue" />
                Refund Processing Time
              </h3>
              <p className="text-gray-600 mb-6">
                In case of any Refunds approved by Bharath Electronics and Appliances, it'll take 9-15 days for the refund to be processed to the end customer.
              </p>
              <a 
                href="mailto:customercare@bharathelectronics.in" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Contact Customer Care
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationRefundPolicy;