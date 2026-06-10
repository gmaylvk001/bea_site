"use client";

import { useState } from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import {
  Users,
  Store,
  ShieldCheck,
  Clock3,
  Phone,
  Mail,
  MapPin,
  Star,
  Lock,
  Send ,
  ClipboardList,
  Ticket,
  Headphones,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    invoice_number:"",
    products:"",
    city: "",
    feedback: "",
    _hp: "",
  });
  const [formLoadTime] = useState(() => Date.now());

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


  // Honeypot check — bots fill hidden fields, humans don't
  if (form._hp) return;

  // Timing check — bots submit too fast
  if (Date.now() - formLoadTime < 3000) {
    setResponseMsg("Please take a moment before submitting.");
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
      setForm({ name: "", email_address: "", mobile_number: "", invoice_number: "", products: "", city: "", feedback: "", _hp: "" });
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


const steps = [
  {
    icon: ClipboardList,
    title: "Submit Your Request",
    desc: "Share your concern or feedback with complete details.",
  },
  {
    icon: Ticket,
    title: "Ticket ID Generated",
    desc: "You will receive a ticket ID via SMS / Email for easy tracking.",
  },
  {
    icon: Headphones,
    title: "Support Team Reviews",
    desc: "Our team will review your request and work on the best solution.",
  },
  {
    icon: CheckCircle,
    title: "Resolution & Update",
    desc: "We will provide resolution and update you at the earliest.",
  },
];

const inputClass = "w-full border rounded-md px-3 py-2 focus:outline-none";

  return (
    <>
  {/* HERO SECTION */}
<section className="relative overflow-hidden bg-gradient-to-r from-[#022A6E] via-[#012B72] to-[#022A6E] text-white">
  {/* Background Overlay */}
  {/* <div className="absolute inset-0 bg-[url('/uploads/feedback-bg.png')] bg-cover bg-center opacity-20"></div> */}

   <div className="relative max-w-7xl mx-auto px-8">
    <div className="grid lg:grid-cols-[60%_40%] items-center min-h-[420px]">

      {/* LEFT CONTENT */}
      <div className="py-10 lg:py-0 text-white">

        <h1 className="text-4xl lg:text-[42px] leading-tight font-bold mb-2">
          Customer Support &
          <br />
          Feedback Centre
        </h1>

        <p className="text-blue-100 text-lg max-w-xl leading-8 mb-3">
          We are here to help with your electronics & home appliance
          purchase, delivery, installation and service support.
        </p>

        {/* STATS BOX */}
        {/* STATS BOX */}
<div className="border border-white/20 rounded-2xl overflow-hidden">
  <div className="grid grid-cols-2 md:grid-cols-4">

    <div className="text-center py-6 border-r border-white/20">
      <Users className="w-12 h-12 mx-auto mb-2 text-white" />
      <h3 className="font-bold text-xl">50 Lakh+</h3>
      <p className="text-sm text-blue-100">
        Happy Customers
      </p>
    </div>

    <div className="text-center py-6 border-r border-white/20">
      <Store className="w-12 h-12 mx-auto mb-2 text-white" />
      <h3 className="font-bold text-xl">47+</h3>
      <p className="text-sm text-blue-100">
        Stores Across
        <br />
        Tamil Nadu
      </p>
    </div>

    <div className="text-center py-6 border-r border-white/20">
      <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-white" />
      <h3 className="font-bold text-xl">
        Authorized
      </h3>
      <p className="text-sm text-blue-100">
        Brand Support
      </p>
    </div>

    <div className="text-center py-6">
      <Clock3 className="w-12 h-12 mx-auto mb-2 text-white" />
      <h3 className="font-bold text-xl">
        Quick Response
      </h3>
      <p className="text-sm text-blue-100">
        Assistance
      </p>
    </div>

  </div>
</div>

      </div>

      {/* RIGHT IMAGE */}
      <div className="hidden lg:flex justify-end items-end h-full">
        <img
  src="/uploads/feedback-bg.png"
  alt="Customer Support Executive"
  className="
    absolute right-[-66px]
    bottom-0
    right-6
    h-[340px]
    xl:h-[450px]
    w-auto
    object-contain
    object-bottom
  "
/>
      </div>

    </div>
  </div>
</section>

  {/* FORM + SUPPORT SECTION */}
  <section className="max-w-7xl mx-auto px-6 py-10">
    <div className="grid lg:grid-cols-12 gap-8">

      {/* LEFT */}
      <div className="lg:col-span-5">
        <div className="bg-white border rounded-xl p-6 shadow-sm">

          <h2 className="text-xl font-bold text-[#2453d3] mb-1">
            Your Trusted Electronics Support Partner
          </h2>

          <p className="text-gray-600 mb-6">At BEA (Bharath Electronics & Appliances), customer satisfaction priority. Our dedicated support teams helps customers with product enquiries, delivery updates, installation assistance, warranty guidance and after-sales support across Tamil Nadu.</p>

          <div className="space-y-2">

  {/* Call */}
  <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 flex items-start gap-4">
    <div className="w-12 h-12 rounded-full bg-[#2453d3] flex items-center justify-center shrink-0">
      <Phone className="w-5 h-5 text-white" />
    </div>

    <div>
      <h4 className="font-semibold">Call Us</h4>
      <p className="font-bold text-[#2453d3]">
        +91 98423 44323
      </p>
      <p className="text-sm text-gray-500">
        Mon - Sun : 09:30 AM - 09:30 PM
      </p>
    </div>
  </div>

  {/* Email */}
  <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 flex items-start gap-4">
    <div className="w-12 h-12 rounded-full bg-[#2453d3] flex items-center justify-center shrink-0">
      <Mail className="w-5 h-5 text-white" />
    </div>

    <div>
      <h4 className="font-semibold">Email Us</h4>
      <p className="text-[#2453d3] break-all">
        customercare@bharathelectronics.in
      </p>
    </div>
  </div>

  {/* Address */}
  <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 flex items-start gap-4">
    <div className="w-12 h-12 rounded-full bg-[#2453d3] flex items-center justify-center shrink-0">
      <MapPin className="w-5 h-5 text-white" />
    </div>

    <div>
      <h4 className="font-semibold">Corporate Office</h4>
      <p className="text-gray-600 text-sm">
        26/1 Dr. Alagappa Chettiyar Rd,
        Tatabad, Coimbatore - 641012,
        Tamil Nadu.
      </p>
    </div>
  </div>

  <a
  href="https://g.page/r/your-google-review-link"
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center justify-between w-full border border-[#2453d3]/20 bg-transparent rounded-xl px-4 py-3 hover:border-[#2453d3] transition"
>
  <div className="flex items-center gap-3">
    <FcGoogle className="text-2xl" />

    <span className="font-semibold text-[#2453d3]">
      Review us on Google
    </span>
  </div>

  <div className="flex items-center gap-1">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className="fill-yellow-400 text-yellow-400"
      />
    ))}
  </div>
</a>

</div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="lg:col-span-7">
        <div className="bg-white border rounded-xl shadow-sm p-6">

          <h2 className="text-xl font-bold text-[#2453d3] mb-2">
            How can we help you today?
          </h2>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-5 mb-5">
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

            {/* Honeypot — hidden from humans, bots will fill this */}
            <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
              <input type="text" name="_hp" value={form._hp} onChange={handleChange} tabIndex="-1" autoComplete="off" />
            </div>

            {/* Submit Button - Full Width */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-[#041b4d] text-white px-6 py-2 rounded-md"
              >
                <Send  className="w-4 h-4" />
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>

              {responseMsg && (
                <p className="text-green-600 font-medium mt-2">{responseMsg}</p>
              )}
            </div>
            
          </form>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 rounded-lg py-2 px-4">
  <Lock className="w-4 h-4 text-[#2453d3] shrink-0" />
  <p>Your information is secure and will only be used to assist you.</p>
</div>
        </div>
      </div>

    </div>
  </section>

  {/* SUPPORT PROCESS */}

<section className="max-w-7xl mx-auto px-6 pb-8">
  <div className="bg-white border rounded-2xl p-8 md:p-10">

    <h2 className="text-xl font-bold text-center text-[#2453d3] mb-5">
      How BEA Support Works
    </h2>

    <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

      {/* Dotted Line */}
      <div className="hidden md:block absolute top-10 left-[12%] right-[12%] border-t-2 border-dashed border-gray-300" />

      {steps.map((step, index) => {
        const Icon = step.icon;

        return (
          <div
            key={index}
            className="relative text-center"
          >
            {/* Icon */}
            <div className="relative mx-auto w-fit">
              <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Icon className="w-9 h-9 text-[#2453d3]" />
              </div>

              {/* Step Number */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#2453d3] text-white text-sm font-bold flex items-center justify-center">
                {index + 1}
              </div>
            </div>

            {/* Content */}
            <h4 className="font-semibold text-gray-900 mt-6 mb-2">
              {step.title}
            </h4>

            <p className="text-sm text-gray-500 leading-6">
              {step.desc}
            </p>
          </div>
        );
      })}
    </div>
  </div>
</section>

  {/* FAQ + HAPPY CUSTOMERS */}
  <section className="max-w-7xl mx-auto px-6 pb-5">

 <div className="grid lg:grid-cols-12 gap-4">

  <div className="lg:col-span-5">
    <div className="bg-white border border-gray-200 rounded-xl p-5 h-full shadow-sm">
      <h2 className="text-2xl font-bold text-[#2453d3] mb-2">
        Frequently Asked Questions
      </h2>

      <div className="space-y-1">

        <details className="border rounded-md px-4 py-3">
          <summary className="cursor-pointer font-medium text-sm">
            How can I contact BEA customer care?
          </summary>
          <p className="mt-3 text-sm text-gray-600">
            Call +91 98423 44323 or email customercare@bharathelectronics.in.
          </p>
        </details>

        <details className="border rounded-md px-4 py-3">
          <summary className="cursor-pointer font-medium text-sm">
            Does BEA provide installation support?
          </summary>
          <p className="mt-3 text-sm text-gray-600">
            Yes, installation support is available for eligible products.
          </p>
        </details>

        <details className="border rounded-md px-4 py-3">
          <summary className="cursor-pointer font-medium text-sm">
            Where are BEA stores located?
          </summary>
          <p className="mt-3 text-sm text-gray-600">
            We have stores across Tamil Nadu.
          </p>
        </details>

        <details className="border rounded-md px-4 py-3">
          <summary className="cursor-pointer font-medium text-sm">
            Does BEA help with warranty support?
          </summary>
          <p className="mt-3 text-sm text-gray-600">
            Yes, our team assists with warranty claims and service requests.
          </p>
        </details>

        <details className="border rounded-md px-4 py-3">
          <summary className="cursor-pointer font-medium text-sm">
            How long does it take to resolve my complaint?
          </summary>
          <p className="mt-3 text-sm text-gray-600">
            Most complaints receive an initial response within 24 hours.
          </p>
        </details>

      </div>

      {/* <button className="mt-4 text-[#2453d3] font-semibold text-sm">
        View all FAQs →
      </button> */}
      </div>
    </div>

    {/* Happy Customers */}
    <div className="lg:col-span-7 mb-5">
<div className="bg-white border border-gray-200 rounded-xl p-5 h-full shadow-sm">
      <h2 className="text-2xl font-bold text-[#2453d3] text-center mb-4">
        Happy Customers Across Tamil Nadu
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {[
          {
            image: "/uploads/customer.png",
            city: "Coimbatore",
          },
          {
            image: "/uploads/customer.png",
            city: "Salem",
          },
          {
            image: "/uploads/customer.png",
            city: "Erode",
          },
          {
            image: "/uploads/customer.png",
            city: "Tiruchirappalli",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="border rounded-lg overflow-hidden bg-white"
          >
            <img
              src={item.image}
              alt={item.city}
              className="w-full h-36 object-cover"
            />

            <div className="py-2 text-center text-sm font-medium">
              {item.city}
            </div>
          </div>
        ))}
      </div>

      {/* Slider Dots */}
      {/* <div className="flex justify-center gap-2 mt-4">
        <span className="w-2 h-2 rounded-full bg-[#2453d3]" />
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="w-2 h-2 rounded-full bg-gray-300" />
      </div> */}
</div>
    </div>

  </div>


</section>

<section className="max-w-7xl mx-auto px-6 pb-12 bg-[#eef4ff] border border-blue-100 rounded-2xl p-6">
  <div className="flex flex-col lg:flex-row items-center gap-6">

    {/* Left Side - 50% */}
    <div className="w-full lg:w-1/2">
      <h3 className="text-2xl font-bold text-[#2453d3] mb-2">
        Need Assistance? We're One Step Ahead.
      </h3>

      <p className="text-gray-600 text-[15px] leading-6">
        Our support team is ready to help you with all your queries.
        Contact us through phone, WhatsApp, or leave us a review
        on Google.
      </p>
    </div>

    {/* Right Side - 50% */}
    <div className="w-full lg:w-1/2 grid grid-cols-1 md:grid-cols-3 gap-3">

      {/* Call Support */}
      <a
        href="tel:9842344323"
        className="bg-white rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Phone className="w-5 h-5 text-[#2453d3]" />
        </div>

        <div>
          <p className="text-xs text-[#2453d3] font-medium">
            Call Support
          </p>

          <p className="font-bold text-[#2453d3] text-sm">
            98423 44323
          </p>
        </div>
      </a>

      {/* WhatsApp */}
      <a
        href="https://wa.me/919842344323"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <MessageCircle className="w-5 h-5 text-green-600" />
        </div>

        <div>
          <p className="text-xs text-[#2453d3] font-medium">
            WhatsApp Support
          </p>

          <p className="font-semibold text-[#2453d3] text-sm">
            Chat with us
          </p>
        </div>
      </a>

      {/* Google Review */}
      <a
        href="#"
        className="bg-white rounded-xl px-4 py-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <FcGoogle className="text-2xl" />
        </div>

        <div>
          <p className="text-xs text-[#2453d3] font-medium">
            Review BEA
          </p>

          <p className="font-semibold text-[#2453d3] text-sm">
            On Google ⭐
          </p>
        </div>
      </a>

    </div>

  </div>
</section>
</>

  );
}
