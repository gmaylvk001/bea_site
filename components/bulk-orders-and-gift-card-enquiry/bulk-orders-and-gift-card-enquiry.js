"use client";
import { useEffect, useState } from "react";
import {FaPhoneAlt,FaEnvelope,FaCheck,FaGift,FaBolt,FaChevronDown,FaChevronUp} from "react-icons/fa";
export default function BulkOrdersAndGiftCardEnquiry() {
    const [form, setForm] = useState({
        name: "",
        company_name: "",
        email_address: "",
        mobile_number: "",
        address: "",
        landmark: "",
        city: "",
        state:"",
        pincode: "",
       /*  product_name: "",
        product_quantity: "", */
        _hp: "",
    });
    const [products, setProducts] = useState([
        { product_name: "", product_quantity: "" },
    ]);
    const [formLoadTime] = useState(() => Date.now());
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [responseMsg, setResponseMsg] = useState("");
    const [touched, setTouched] = useState({});
    const handleBlur = (e) => {
        setTouched({ ...touched, [e.target.name]: true });
    };
 
    // Add new row
const addProductRow = () => {
  setProducts([
    ...products,
    { product_name: "", product_quantity: "" },
  ]);
};

// Handle product change
const handleProductChange = (index, field, value) => {
  const updatedProducts = [...products];
  updatedProducts[index][field] = value;
  setProducts(updatedProducts);
};
// Remove row
const removeProductRow = (index) => {
  const updatedProducts = products.filter((_, i) => i !== index);
  setProducts(updatedProducts);
};

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
        if (!form.company_name.trim()) newErrors.company_name = "Company Name is required";
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
        if (!form.address.trim()) newErrors.address = "Address is required";
        if (!form.landmark.trim()) newErrors.landmark = "Landmark is required";
        if (!form.city.trim()) newErrors.city = "City is required";
        if (!form.state.trim()) newErrors.state = "State is required";
        if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";
        /* if (!form.product_name.trim()) newErrors.product_name = "Product is required";
        if (!form.product_quantity.trim()) newErrors.product_quantity = "Qty is required"; */

        // Product Validation
  const productErrors = [];

  products.forEach((product, index) => {
    const itemError = {};

    // Product Name
    if (!product.product_name.trim()) {
      itemError.product_name = "Product is required";
    }

    // Product Quantity
    if (!product.product_quantity.toString().trim()) {
      itemError.product_quantity = "Qty is required";
    }

    if (Object.keys(itemError).length > 0) {
      productErrors[index] = itemError;
    }
  });

  if (productErrors.length > 0) {
    newErrors.products = productErrors;
  }

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
            const res = await fetch("/api/bulk-orders-and-gift-card-enquiry/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // body: JSON.stringify(form),
                body: JSON.stringify({
                    ...form,
                    product_name_and_quantity: products,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                const contact = data.data;
                const productsDetails = contact.product_name_and_quantity
                ?.map(
                    (item) =>
                    `${item.product_name} - ${item.product_quantity}`
                )
                .join("<br/>");
                const adminemailFormData = new FormData();
                adminemailFormData.append("campaign_id", "9d517b62-99ab-455b-a23a-84211c07adce");
                adminemailFormData.append(
                    "params",
                    JSON.stringify([contact.name,contact.company_name,contact.email_address,contact.mobile_number,contact.address,contact.landmark,contact.city,contact.state,contact.pincode,productsDetails])
                );
                const emailadmin = ["arunkarthik@bharathelectronics.in","rajesh@bharathelectronics.in","customercare@bharathelectronics.in"];
                // const emailadmin = ["sorambeeviuit@gmail.com"];
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
                setForm({ name: "", company_name: "", email_address: "", mobile_number: "", address:"", landmark: "", city: "", state:"", pincode: "", _hp: "" });
                setProducts([
                    { product_name: "", product_quantity: "" },
                ]);
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
            // setResponseMsg("Server error");
            setResponseMsg("Something went wrong. Please check your details and try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full border rounded-md px-3 py-2 focus:outline-none";
    return (
        <>
            <section className="w-full overflow-hidden">
                <img src="/uploads/B2B_NEW.webp" alt="Bulk Order and Enquiry" className="w-full h-auto block"/>
            </section>
            <h1 className="text-2xl md:text-5xl font-bold text-center mt-6 px-4">Bulk Order & Enquiry</h1>
            {/* White Content Box */}
            <div className="bg-white text-black rounded-xl p-6 md:p-8 max-w-5xl mx-auto">
                <p className="text-[15px] md:text-[17px] leading-8 mb-6">Are you a business looking for a bulk purchase of electronic items? BEA has a dedicated B2B team which works to fulfil bulk electronicorders for corporate requirements.</p>

                <p className="text-[15px] md:text-[17px] leading-8">Our B2B team will work closely with you to understand your requirements which may include:</p>
                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="mt-2 w-2 h-2 rounded-full bg-black"></div>
                        <p className="text-[15px] md:text-[17px]">Corporate Requirements for customer/dealer/employee gifting</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-2 w-2 h-2 rounded-full bg-black"></div>
                        <p className="text-[15px] md:text-[17px]">Institutional Requirements for offices and work sites</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-2 w-2 h-2 rounded-full bg-black"></div>
                        <p className="text-[15px] md:text-[17px]">Employee engagement programs and corporate gifting solutions</p>
                    </div>
                </div>
                <p className="text-[15px] md:text-[17px] leading-8">Our corporate team will offer the best pricing for your bulk order and continue to support you even for after-sales needs.Fill out the enquiry form below and we will reach out to you.</p>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-8 mb-12 items-stretch">
                    {/* LEFT SIDE */}
                    <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-black via-[#0b1235] to-[#004d43] p-8 md:p-10 text-white shadow-2xl">
                        {/* Glow Effects */}
                        <div className="absolute -top-10 -right-10 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-sm text-gray-300 mb-3 uppercase tracking-[3px]">BEA Corporate Solutions</p>
                            <h2 className="text-4xl md:text-3xl font-bold leading-tight mb-3">Bulk Order & Enquiry</h2>
                            <p className="text-gray-200 leading-8 text-[15px] mb-2">Looking for corporate gifting, employee rewards, institutional electronics purchase, or bulk business orders? Our dedicated BEA corporate team will help you with pricing, quotation, delivery, and after-sales support.
                            </p>
                            <div className="space-y-5">
                                {/* Card 1 */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white text-[#0b1235] flex items-center justify-center text-xl shrink-0"><FaCheck /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Corporate Bulk Orders</h3>
                                        <p className="text-sm text-gray-200 leading-6">Best pricing and support for offices, institutions, resellers, and enterprise purchases.</p>
                                    </div>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white text-[#0b1235] flex items-center justify-center text-xl shrink-0"><FaGift /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Gift Card Solutions</h3>
                                        <p className="text-sm text-gray-200 leading-6">Festival gifting, employee engagement, and customised gift card programs for businesses.</p>
                                    </div>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex gap-4">
                                    <div className="w-14 h-14 rounded-full bg-white text-[#0b1235] flex items-center justify-center text-xl shrink-0"><FaBolt /></div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Dedicated Support</h3>
                                        <p className="text-sm text-gray-200 leading-6">Our team assists you with quotations, product selection, delivery, and coordination.</p>
                                    </div>
                                </div>
                            </div>
                            {/* Contact */}
                            <div className="mt-3 pt-6 border-t border-white/20 space-y-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><FaPhoneAlt /></div>
                                    <div>
                                        <p className="text-sm text-gray-300">Call Us</p>
                                        <a href="tel:9842344323" className="font-semibold hover:underline">9842344323</a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"><FaEnvelope /></div>
                                    <div>
                                        <p className="text-sm text-gray-300">Mail Us</p>
                                        <a href="mailto:customercare@bharathelectronics.in" className="font-semibold hover:underline break-all">customercare@bharathelectronics.in</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT FORM */}
                    <div className="bg-white rounded-[30px] border border-gray-200 shadow-2xl p-6 md:p-8">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h2>
                            <p className="text-gray-500 text-sm md:text-base">Fill your details and our corporate team will contact you shortly.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                                <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your name" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.name && touched.name
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.name && touched.name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Company Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Company Name *</label>
                                <input type="text" name="company_name" value={form.company_name} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your company name" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.company_name && touched.company_name
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.company_name && touched.company_name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.company_name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Email Address *</label>
                                <input type="email" name="email_address" value={form.email_address} onChange={handleChange} onBlur={handleBlur} placeholder="Enter your email" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.email_address && touched.email_address
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.email_address && touched.email_address && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.email_address}
                                    </p>
                                )}
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Mobile Number *</label>
                                <input type="text" name="mobile_number" value={form.mobile_number} onChange={handleChange} onBlur={handleBlur} maxLength={10} placeholder="Enter mobile number" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    "mobile_number" in errors && touched.mobile_number
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>

                                {errors.mobile_number && touched.mobile_number && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.mobile_number}
                                    </p>
                                )}
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Address *</label>
                                <input type="text" name="address" value={form.address} onChange={handleChange} onBlur={handleBlur} placeholder="Flat no./Building Name/Society" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.address && touched.address
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.address && touched.address && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.address}
                                    </p>
                                )}
                            </div>

                            {/* Landmark */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Landmark *</label>
                                <input type="text" name="landmark" value={form.landmark} onChange={handleChange} onBlur={handleBlur} placeholder="Landmark/Locatlity/Area" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.landmark && touched.landmark
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.landmark && touched.landmark && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.landmark}
                                    </p>
                                )}
                            </div>

                            {/* City */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">City *</label>
                                <input type="text" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} placeholder="Enter city" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.city && touched.city
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.city && touched.city && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.city}
                                    </p>
                                )}
                            </div>

                            {/* State */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">State *</label>
                                <input type="text" name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} placeholder="Enter state" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.state && touched.state
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.state && touched.state && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.state}
                                    </p>
                                )}
                            </div>

                            {/* Pincode */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Pincode *</label>
                                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} onBlur={handleBlur} placeholder="Enter pincode" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.pincode && touched.pincode
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}/>
                                {errors.pincode && touched.pincode && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.pincode}
                                    </p>
                                )}
                            </div>

                            {/* Product Details */}
{/* Product Details */}
<div className="col-span-1 md:col-span-2 mt-6">
  <label className="block text-sm font-semibold mb-3 text-gray-700">
    Product Details *
  </label>

  <div className="space-y-4">
    {products.map((product, index) => (
      <div
        key={index}
        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-start"
      >
        {/* Product Name */}
        <div>
          <input
            type="text"
            placeholder="Enter product name"
            value={product.product_name}
            onChange={(e) =>
              handleProductChange(
                index,
                "product_name",
                e.target.value
              )
            }
            className={`w-full h-12 rounded-xl border bg-gray-50 px-4 focus:outline-none focus:bg-white ${
              errors.products?.[index]?.product_name
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {errors.products?.[index]?.product_name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.products[index].product_name}
            </p>
          )}
        </div>

        {/* Product Quantity */}
        <div>
          <input
            type="number"
            placeholder="Enter quantity"
            value={product.product_quantity}
            onChange={(e) =>
              handleProductChange(
                index,
                "product_quantity",
                e.target.value
              )
            }
            className={`w-full h-12 rounded-xl border bg-gray-50 px-4 focus:outline-none focus:bg-white ${
              errors.products?.[index]?.product_quantity
                ? "border-red-500"
                : "border-gray-300"
            }`}
          />

          {errors.products?.[index]?.product_quantity && (
            <p className="text-red-500 text-sm mt-1">
              {errors.products[index].product_quantity}
            </p>
          )}
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={addProductRow}
          className="h-12 w-12 rounded-xl bg-black text-white text-2xl flex items-center justify-center"
        >
          +
        </button>

        {/* Delete Button */}
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => removeProductRow(index)}
            className="h-12 w-12 rounded-xl bg-red-500 text-white text-2xl flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>
    ))}
  </div>
</div>

                            {/* Honeypot */}
                            <div style={{position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden",}}aria-hidden="true">
                                <input type="text" name="_hp" value={form._hp} onChange={handleChange} tabIndex="-1" autoComplete="off"/>
                            </div>

                            {/* Submit */}
                            <div className="md:col-span-2 pt-2">
                                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-to-r from-[#0b1235] to-[#004d43] hover:opacity-90 text-white font-semibold transition-all duration-300">
                                    {loading ? "Submitting..." : "Submit Enquiry"}
                                </button>
                                {responseMsg && (
                                    <p className="text-center text-green-600 font-medium mt-4">
                                        {responseMsg}
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
