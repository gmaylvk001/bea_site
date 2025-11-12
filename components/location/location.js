'use client';
import React from 'react';
import { useEffect, useState } from "react";
export default function LocationPage() {

const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    async function fetchBranches() {
      try {
        const res = await fetch("/api/store/get");
        const data = await res.json();
        if (data.success) {
          setBranches(data.data); // <-- correct state
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBranches();
  }, []);


  if (loading) return <p>Loading branches...</p>;

    if (!branches || branches.length === 0) {
    return <p>No branches found.</p>;
  }


  return (
    <div className="min-h-screen bg-white py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-customBlue mb-10">Our Branches</h1>

        {/* Branch Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {branches.map((branch, idx) => (
        <div
  key={branch._id || idx}
  className="border border-blue-300 rounded-lg shadow-sm p-4 hover:shadow-md transition"
>
  <h2 className="text-md font-semibold text-gray-800 mb-2">
    {branch.title}
  </h2>
  <p className="text-sm text-gray-700 mb-1">{branch.address}</p>
  <p className="text-sm text-gray-700 mb-1">{branch.city}</p>
  <p className="text-sm text-gray-700 mb-1">Phone: {branch.phone}</p>
  
  <a
    href={`mailto:${branch.email}?subject=Inquiry&body=Hello, I would like to know more about your services.`}
    className="text-blue-600 hover:underline"
  >
    {branch.email}
  </a>

  {/* Google Maps Embed */}
  <div className="mt-3">
    <iframe
      src={`https://www.google.com/maps?q=${encodeURIComponent(branch.address)}&output=embed`}
      width="100%"
      height="200"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
    ></iframe>
  </div>
</div>

      ))}
    </div>
        {/* <div className="mt-10 w-full h-[400px]">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3911.9092186355943!2d76.95661931480073!3d11.016844292153897!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba85c3b8336cfd1%3A0xa329b2d72a9e92ee!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1647442610000!5m2!1sen!2sin"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    allowFullScreen=""
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</div> */}

      </div>
    </div>
  );
}
