'use client';
import React from 'react';
import { useEffect, useState } from "react";
import Link from "next/link";
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
  <div className="mt-4 flex items-center justify-between">
  {/* Visit Store */}
  <Link
    href={`/store/${branch.slug}`}
    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition"
  >
    Visit Store
  </Link>

  {/* WhatsApp Button */}
  <a
     href={`https://wa.me/?text=Bharath Electronics And Appliances ${branch.organisation_name},${branch.city}. ${encodeURIComponent(branch.website)}`}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-sm transition"
    aria-label="Chat on WhatsApp"
  >
     <svg
                            className="w-5 h-5"
                            viewBox="0 0 32 32"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M16.003 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.773.736 5.368 2.009 7.629L2 30l6.565-2.643A13.254 13.254 0 0016.003 29.333C23.36 29.333 29.333 23.36 29.333 16c0-7.36-5.973-13.333-13.33-13.333zm7.608 18.565c-.32.894-1.87 1.749-2.574 1.865-.657.104-1.479.148-2.385-.148-.55-.175-1.256-.412-2.162-.812-3.8-1.648-6.294-5.77-6.49-6.04-.192-.269-1.55-2.066-1.55-3.943 0-1.878.982-2.801 1.33-3.168.346-.364.75-.456 1.001-.456.25 0 .5.002.719.013.231.01.539-.088.845.643.32.768 1.085 2.669 1.18 2.863.096.192.16.423.03.683-.134.26-.2.423-.39.65-.192.231-.413.512-.589.689-.192.192-.391.401-.173.788.222.392.986 1.625 2.116 2.636 1.454 1.298 2.682 1.7 3.075 1.894.393.192.618.173.845-.096.23-.27.975-1.136 1.237-1.527.262-.392.524-.32.894-.192.375.13 2.35 1.107 2.75 1.308.393.205.656.308.75.48.096.173.096 1.003-.224 1.897z" />
                          </svg>
  </a>
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
