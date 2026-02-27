"use client";

import { useState } from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";


export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    invoice_number:"",
    products:"",
    city: "",
    feedback: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");

  const [touched, setTouched] = useState({});

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  /* const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }; */

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, [name]: digits });
      setTouched(prev => ({ ...prev, mobile_number: true }));
      if (!digits) {
        setErrors(prev => ({ ...prev, mobile_number: "" }));
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrors(prev => ({ ...prev, mobile_number: "Invalid Mobile Number" }));
      } else {
        setErrors(prev => { const { mobile_number: _, ...rest } = prev; return rest; });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
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
      newErrors.mobile_number = "";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile_number)) {
      newErrors.mobile_number = "Invalid Mobile Number";
    }
 
    if (!form.invoice_number.trim()) newErrors.invoice_number = "Invoice is required";
    if (!form.products.trim()) newErrors.products = "Products is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.feedback.trim()) newErrors.feedback = "Feedback field is required";
 
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
    const res = await fetch("/api/feedback/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      const FeedBack = data.data;
      const adminemailFormData = new FormData();
      adminemailFormData.append("campaign_id", "bdd26532-7c0d-49d3-8715-369ab8f033bb");
      adminemailFormData.append(
        "params",
        JSON.stringify([FeedBack.name,FeedBack.email_address,FeedBack.mobile_number,FeedBack.invoice_number,FeedBack.products, FeedBack.city,FeedBack.feedback])
      );

      const emailadmin = ["arunkarthik@bharathelectronics.in","ecom@bharathelectronics.in","Customercare@bharathelectronics.in"];

      emailadmin.forEach(async (emailadmin) => {
        adminemailFormData.set("email", emailadmin);
        let adminresponse = await fetch("https://bea.eygr.in/api/email/send-msg", {
          method: "POST",
          headers: {
            Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
          },
          body: adminemailFormData, // Use the renamed variable
        });

        let adminData = await adminresponse.json();
      });
      setResponseMsg("Message sent successfully!");
      setForm({ name: "", email_address: "", mobile_number: "", invoice_number: "", products: "", city: "", feedback: "" });
      setErrors({});
      setTouched({});

      // Clear message after 2 seconds
      setTimeout(() => {
        setResponseMsg("");
      }, 2000);
    } else {
      setResponseMsg(data.message || "Something went wrong");
    }
  } catch (error) {
    setResponseMsg("Something went wrong. Please check your details and try again.");
  } finally {
    setLoading(false);
  }
};

const inputClass = "w-full border rounded-md px-3 py-2 focus:outline-none";

  return (
    <>
    {/* banner section */}
     <section className="relative w-full h-[200px] md:h-[300px] lg:h-[250px] flex items-center justify-center bg-gradient-to-r from-gray-800 to-black text-white">
        <div className="absolute inset-0">
          <img
            src="uploads/feedback.jpg"
            alt="Contact Us"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative text-left px-4">
          <h1 className="text-3xl md:text-5xl font-bold">Feedback / Complaints</h1>
        </div>
      </section>

    {/* content section */}
    <div className="max-w-7xl mx-auto px-6 py-9">
      <h2 className="text-3xl font-bold mb-3 text-center text-[#2453d3]">Thank you for Purchasing at Bharath Electronics & Appliances!</h2>
      <p className="text-center text-lg mb-8">We look forward to a long and mutually beneficial relationship.</p>
      <div className="flex flex-col-reverse md:grid md:grid-cols-2 gap-10 items-center">
        
        {/* Contact Details (Moved to Left) */}
        <div className="text-center px-4">
          <img 
            src="uploads/query-image.jpg" 
            alt="Customer Service" 
            className="mx-auto max-w-full sm:w-64 h-auto mb-4 p-4"
          />
          
          <h4 className="text-center mb-6">
            If you have any questions concerning our products / delivery, please call our customer service department at 
            <b>+91 98423 44323</b>.
          </h4>
          
          <a href="tel:9865555000" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-[#2453d3] transition">
            Click to Call
          </a>
        </div>


        {/* Write Us Form (Now on Right) */}
        <div className="p-5 border border-2 rounded">
          <h2 className="text-3xl font-bold mb-4 pb-2 text-center border-b-2">Bharath Electronics – Feedback</h2>
          <form onSubmit={handleSubmit} className="px-8 mt-6 grid grid-cols-2 md:grid-cols-2 gap-4">
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
                onBlur={handleBlur}
                className={`${inputClass} ${errors.name && touched.name ? "border-red-500" : "border-gray-300"}`}
              />
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
                onBlur={handleBlur}
                className={`${inputClass} ${errors.email_address && touched.email_address ? "border-red-500" : "border-gray-300"}`}
              />
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
                onBlur={handleBlur}
                maxLength={10}
                className={`${inputClass} ${'mobile_number' in errors && touched.mobile_number ? "border-red-500" : "border-gray-300"}`}
                // className={`${inputClass} ${errors.mobile_number && touched.mobile_number ? "border-red-500" : "border-gray-300"}`}
              />
              {errors.mobile_number && touched.mobile_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>
                )}
            </div>

            {/* invoice_number */}
            <div>
              <label className="block font-medium mb-1">
                Invoice Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                value={form.invoice_number}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass} ${errors.invoice_number && touched.invoice_number ? "border-red-500" : "border-gray-300"}`}
              />
            </div>

            {/* product */}
            <div>
              <label className="block font-medium mb-1">
                Products <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="products"
                value={form.products}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass} ${errors.products && touched.products ? "border-red-500" : "border-gray-300"}`}
              />
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
                onBlur={handleBlur}
                className={`${inputClass} ${errors.city && touched.city ? "border-red-500" : "border-gray-300"}`}
              />
            </div>

            {/* Feedback - Full Width */}
            <div className="col-span-full md:col-span-2">
              <label className="block font-medium mb-1">
                Feedback<span className="text-red-600">*</span>
              </label>
              <textarea
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass} ${errors.feedback && touched.feedback ? "border-red-500" : "border-gray-300"}`}
              ></textarea>
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
    </div>
    </>

  );
}
