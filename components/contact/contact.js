"use client";

import { useEffect, useState } from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    city: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");

  const [touched, setTouched] = useState({});
 
  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };
 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
 
    if (!form.name.trim()) newErrors.name = "Name is required";
    
    if (!form.email_address.trim()) {
      newErrors.email_address = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email_address)) {
      newErrors.email_address = "Email is invalid";
    }
 
    if (!form.mobile_number.trim()) {
      newErrors.mobile_number = "Phone number is required";
    } else if (!/^\d{10,15}$/.test(form.mobile_number)) {
      newErrors.mobile_number = "Enter a valid phone number";
    }
 
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.message.trim()) newErrors.message = "Message is required";
 
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setResponseMsg("");

    try {
      const res = await fetch("/api/contact/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setResponseMsg("Message sent successfully!");
        setForm({ name: "", email_address: "", mobile_number: "", city: "", message: "" });

        // Clear message after 2 seconds
        setTimeout(() => {
          setResponseMsg("");
        }, 2000);
      } else {
        setResponseMsg(data.message || "Something went wrong");
      }
    } catch (error) {
      setResponseMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  const [storeGroups, setStoreGroups] = useState([]);

  useEffect(() => {
    async function fetchStores() {

      const res   = await fetch("api/contact/get/store/");
      const data  = await res.json();

      if (data.success) {
        setStoreGroups(data.data);
      } 
    }
    fetchStores();

  }, []);

  const inputClass = "w-full border rounded-md px-3 py-2 focus:outline-none";

  return (
    <>
      <section className="relative w-full h-[200px] md:h-[300px] lg:h-[250px] flex items-center justify-center bg-gradient-to-r from-gray-800 to-black text-white">
        <div className="absolute inset-0">
          <img
            src="uploads/about-bea.png"
            alt="Contact Us"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative text-left px-4">
          <h1 className="text-3xl md:text-5xl font-bold">Contact BEA</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-5">
          {/* Contact Details (Moved to Left) */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Contact Us</h2>
            <p className="font-semibold text-gray-700 mb-4">
              You may contact us using the information below:
            </p>

            <div className="space-y-4">
              {/* Registered Address */}
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="currentColor" />
                </svg>
                <p>
                  <b>Registered Address:</b><span className="text-gray-600"> 383, 100 Feet Road, Gandhipuram,
                  Coimbatore, Tamilnadu 641012</span>
                </p>
              </div>

              {/* Operational Address */}
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="currentColor" />
                </svg>
                <p>
                  <b>Operational Address:</b><span className="text-gray-600"> 383, 100 Feet Road, Gandhipuram,
                  Coimbatore, Tamilnadu 641012</span>
                </p>
              </div>

              {/* Phone */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a1 1 0 01.95.684l1.518 4.553a1 1 0 01-.272 1.06l-1.2 1.2a16.001 16.001 0 006.586 6.586l1.2-1.2a1 1 0 011.06-.272l4.553 1.518a1 1 0 01.684.95V19a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z" />
                </svg>
                <p>
                  <b>Telephone No:</b>{" "}
                  <a href="tel:9842344323" className="hover:underline text-gray-600">
                    9842344323
                  </a>
                </p>
              </div>

              {/* Email */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12l-4-4m0 0l-4 4m4-4v12" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16v12H4z" />
                </svg>
                <p>
                  <b>E-Mail ID:</b>{" "}
                  <a
                    href="mailto:customercare@bharathelectronics.in"
                    className="hover:underline text-gray-600"
                  >
                    customercare@bharathelectronics.in
                  </a>
                </p>
              </div>

              {/* Merchant Name */}
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 7a2 2 0 012-2h14a2 2 0 012 2M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" />
                </svg>
                <p>
                  <b>Merchant Legal Entity Name:</b><span className="text-gray-600"> Bharath Electronics and Appliances</span>
                </p>
              </div>
            </div>
          </div>
          {/* Write Us Form (Now on Right) */}
          <div className="p-5 border border-2 rounded">
            <h2 className="text-3xl font-bold mb-3 text-center"> Got Any Questions? </h2>
            <p className="text-center">Use the form below to get in touch with the sales team</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Name */}
              <div>
                <label className="block font-medium mb-1">
                  Name<span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.name && (touched.name || submitted) ? "border-red-500" : "border-gray-300"}`}
                />
                {/* {errors.name && <p className="text-red-500 mt-1 text-sm">{errors.name}</p>} */}
              </div>

              {/* Email */}
              <div>
                <label className="block font-medium mb-1">
                  Email<span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email_address"
                  value={form.email_address}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.email_address && (touched.email_address || submitted) ? "border-red-500" : "border-gray-300"}`}
                />
                {/* {errors.email_address && <p className="text-red-500 mt-1 text-sm">{errors.email_address}</p>} */}
              </div>

              {/* Phone */}
              <div>
                <label className="block font-medium mb-1">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="mobile_number"
                  value={form.mobile_number}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.mobile_number && (touched.mobile_number || submitted) ? "border-red-500" : "border-gray-300"}`}
                />
                {/* {errors.mobile_number && <p className="text-red-500 mt-1 text-sm">{errors.mobile_number}</p>} */}
              </div>

              {/* City */}
              <div>
                <label className="block font-medium mb-1">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.city && (touched.city || submitted) ? "border-red-500" : "border-gray-300"}`}
                />
                {/* {errors.mobile_number && <p className="text-red-500 mt-1 text-sm">{errors.mobile_number}</p>} */}
              </div>

              {/* Message - Full Width */}
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">
                  Message<span className="text-red-600">*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  className={`${inputClass} ${errors.message && (touched.message || submitted) ? "border-red-500" : "border-gray-300"} h-28`}
                ></textarea>
                {/* {errors.message && <p className="text-red-500 mt-1 text-sm">{errors.message}</p>} */}
              </div>

              {/* Submit Button - Full Width */}
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>

                {responseMsg && (
                  <p className="text-green-600 font-medium mt-2">{responseMsg}</p>
                )}
              </div>
            </form>
          </div>
        </div>

        {/** --- Coimbatore --- */}
        {storeGroups
          .filter(group => group.city.toLowerCase() === "coimbatore")
          .map((group, idx) => (
            <section key={idx} className="bg-white py-6">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-center mb-3">
                  SHOWROOMS IN {group.city.toUpperCase()}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.stores.map((store) => (
                    <div key={store._id} className="bg-gray-100 p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">
                        {store.organisation_name}
                      </h3>
                      <p className="text-sm text-gray-700">{store.address},</p>
                      {/* <p className="text-sm text-gray-700">
                        {store.city} - {store.zipcode}.
                      </p> */}
                      <p className="text-sm text-gray-800">{store.phone}</p>
                      <p className="text-sm text-blue-600 underline mb-4">
                        <a
                          href={`mailto:${store.email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {store.email}
                        </a>
                      </p>
                      {/* <a
                        href={`https://wa.me/${store.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded"
                      >
                        Whatsapp
                      </a> */}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))
        }

        {/** --- Salem --- */}
        {storeGroups
          .filter(group => group.city.toLowerCase() === "salem")
          .map((group, idx) => (
            <section key={idx} className="bg-white py-6">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-2xl font-bold text-center mb-3">
                  SHOWROOMS IN {group.city.toUpperCase()}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {group.stores.map((store) => (
                    <div key={store._id} className="bg-gray-100 p-6 rounded-lg shadow">
                      <h3 className="text-lg font-bold text-blue-900 mb-2">
                        {store.organisation_name}
                      </h3>
                      <p className="text-sm text-gray-700">{store.address},</p>
                      {/* <p className="text-sm text-gray-700">
                        {store.city} - {store.zipcode}.
                      </p> */}
                      <p className="text-sm text-gray-800">{store.phone}</p>
                      <p className="text-sm text-blue-600 underline mb-4">
                        <a
                          href={`mailto:${store.email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {store.email}
                        </a>
                      </p>
                      {/* <a
                        href={`https://wa.me/${store.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded"
                      >
                        Whatsapp
                      </a> */}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))
        }

        {/** --- Remaining Cities as "Around Tamilnadu" --- */}
        <section className="bg-white py-6">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-3">
              SHOWROOMS AROUND TAMILNADU
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {storeGroups
                .filter(
                  group =>
                    !["coimbatore", "salem"].includes(group.city.toLowerCase())
                )
                .flatMap(group => group.stores)
                .map(store => (
                  <div key={store._id} className="bg-gray-100 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">
                      {store.organisation_name}
                    </h3>
                    <p className="text-sm text-gray-700">{store.address},</p>
                    {/* <p className="text-sm text-gray-700">
                      {store.city} - {store.zipcode}.
                    </p> */}
                    <p className="text-sm text-gray-800">{store.phone}</p>
                    <p className="text-sm text-blue-600 underline mb-4">
                      <a
                        href={`mailto:${store.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {store.email}
                      </a>
                    </p>
                    {/* <a
                      href={`https://wa.me/${store.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded"
                    >
                      Whatsapp
                    </a> */}
                  </div>
                ))}
            </div>
          </div>
        </section>     

      </div>
    </>
  );
}
