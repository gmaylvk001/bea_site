"use client";
import { useEffect, useState } from "react";
import {FaPhoneAlt,FaEnvelope,FaCheck,FaGift,FaBolt,FaChevronDown,FaChevronUp} from "react-icons/fa";
export default function BulkOrdersAndGiftCardEnquiry() {
    const [form, setForm] = useState({
        company_name: "",
        name: "",
        mobile_number: "",
        email_address: "",
        city: "",
        business_type: "",
        requirement_category: "",
        gst_number: "",
        /* address: "",
        landmark: "",
        state:"",
        pincode: "",
        product_name: "",
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
        if (!form.city.trim()) newErrors.city = "City is required";
        if (!form.business_type.trim()) newErrors.business_type = "Business Type is required";
        if (!form.requirement_category.trim()) newErrors.requirement_category = "Requirement category is required";
        /* if (!form.address.trim()) newErrors.address = "Address is required";
        if (!form.landmark.trim()) newErrors.landmark = "Landmark is required";
        if (!form.state.trim()) newErrors.state = "State is required";
        if (!form.pincode.trim()) newErrors.pincode = "Pincode is required";
        if (!form.product_name.trim()) newErrors.product_name = "Product is required";
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
                    JSON.stringify([contact.name,contact.company_name,contact.email_address,contact.mobile_number,contact.city,contact.business_type,contact.requirement_category,contact.gst_number,productsDetails])
                );
                // const emailadmin = ["arunkarthik@bharathelectronics.in","rajesh@bharathelectronics.in","customercare@bharathelectronics.in"];
                const emailadmin = ["sorambeeviuit@gmail.com"];
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
                setForm({ company_name: "", name: "",  email_address: "", mobile_number: "", city: "", business_type:"", requirement_category: "", gst_number: "", _hp: "" });
                // setForm({ name: "", company_name: "", email_address: "", mobile_number: "", address:"", landmark: "", city: "", state:"", pincode: "", _hp: "" });
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
                <img src="/uploads/B2B.webp" alt="Bulk Order and Enquiry" className="w-full h-auto block"/>
            </section>
            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl font-bold text-center text-black mb-6">
                    Bulk Order & Corporate Solutions
                </h2>

                {/* Paragraphs */}
                <div className="space-y-3 text-left">
                    <p className="text-black leading-8 text-[16px]">
                        Looking for bulk electronics, appliances, corporate gifting, or institutional purchases?
                    </p>

                    <p className="text-black leading-8 text-[16px]">
                        BEA Corporate Solutions provides dedicated pricing, product consultation, delivery coordination, and after-sales support for businesses across Tamil Nadu.
                    </p>
                </div>

                {/* Second Heading */}
                <h2 className="text-3xl md:text-4xl font-bold text-center text-black mt-5 mb-6">
                    Complete Electronics & Appliance Solutions for Businesses
                </h2>

                {/* Paragraphs */}
                <div className="space-y-3 text-left">
                    <p className="text-black leading-8 text-[16px]">
                        BEA Corporate Solutions helps businesses, institutions, hotels, builders, offices, and retailers fulfil bulk electronics and appliance requirements with ease.
                    </p>

                    <p className="text-black leading-8 text-[16px]">
                        From product consultation and quotation support to delivery coordination and after-sales service, our dedicated B2B team ensures a smooth and reliable experience for every business order.
                    </p>

                    <p className="text-black leading-8 text-[16px]">
                        Whether you require a single category or multi-brand bulk purchases, BEA offers competitive pricing, GST billing, and trusted support across Tamil Nadu.
                    </p>
                </div>

                {/* Small Title */}
                <p className="text-sm font-bold uppercase tracking-[4px] text-center mt-5 mb-6">
                    Our Corporate Services
                </p>

                {/* Cards */}
                <div className="space-y-5">
                    {/* Card 1 */}
                    <div className="bg-white shadow-lg border rounded-2xl p-5 flex gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#0b1235] text-white flex items-center justify-center text-xl shrink-0">
                            <FaCheck />
                        </div>

                        <div>
                            <h3 className="font-semibold text-xl text-black mb-2">
                                Corporate Bulk Orders
                            </h3>

                            <p className="text-gray-600 leading-7 text-[15px]">
                                Best pricing and dedicated support for offices, institutions, builders, resellers, and enterprise purchases.
                            </p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white shadow-lg border rounded-2xl p-5 flex gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#0b1235] text-white flex items-center justify-center text-xl shrink-0">
                            <FaGift />
                        </div>

                        <div>
                            <h3 className="font-semibold text-xl text-black mb-2">
                                Employee & Festival Gifting
                            </h3>

                            <p className="text-gray-600 leading-7 text-[15px]">
                                Customized gifting solutions for employees, dealers, customers, and festive campaigns.
                            </p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white shadow-lg border rounded-2xl p-5 flex gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#0b1235] text-white flex items-center justify-center text-xl shrink-0">
                            <FaBolt />
                        </div>

                        <div>
                            <h3 className="font-semibold text-xl text-black mb-2">
                                Institutional Requirements
                            </h3>

                            <p className="text-gray-600 leading-7 text-[15px]">
                                Solutions for hotels, offices, schools, hospitals, apartments, and commercial projects.
                            </p>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white shadow-lg border rounded-2xl p-5 flex gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#0b1235] text-white flex items-center justify-center text-xl shrink-0">
                            <FaBolt />
                        </div>

                        <div>
                            <h3 className="font-semibold text-xl text-black mb-2">
                                Dedicated B2B Support
                            </h3>

                            <p className="text-gray-600 leading-7 text-[15px]">
                                From quotation to delivery and installation, our corporate team ensures smooth coordination throughout the process.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-center mt-3 px-4">Trusted by Businesses Across Tamil Nadu</h1>
            <div className="bg-white text-black rounded-xl p-6 md:p-3 max-w-5xl mx-auto">
                <p className="text-[15px] md:text-[17px] leading-8 mb-3">Supporting corporate offices, institutions, hospitality projects, retailers, and enterprise clients with bulk electronics and appliance solutions.</p>
            </div>
            <div className="bg-white text-black rounded-xl p-6 md:p-3 max-w-5xl mx-auto">
                <div className="flex flex-wrap justify-center items-center gap-3 whitespace-nowrap">
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🏨 Hotels</span>
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🏢 Offices</span>
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🏗️ Builders</span>
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🏫 Schools & Colleges</span>
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🛍️ Retail Chains</span>
                    <span className="px-4 py-2 rounded-full bg-gray-100 border text-[15px] md:text-[16px] cursor-default select-none">🏥 Hospitals</span>
                </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center mt-3 px-4">Why Businesses Choose BEA</h1>
            <div className="flex justify-center p-6">
                <ul className="space-y-3 text-[15px] md:text-[16px] text-black text-start">
                    <li className="flex items-center gap-2">✅ Competitive Bulk Pricing</li>
                    <li className="flex items-center gap-2">✅ Multi-Brand Product Availability</li>
                    <li className="flex items-center gap-2">✅ Dedicated Relationship Manager</li>
                    <li className="flex items-center gap-2">✅ GST Billing Available</li>
                    <li className="flex items-center gap-2">✅ Delivery Across Tamil Nadu</li>
                    <li className="flex items-center gap-2">✅ Installation & After-Sales Support</li>
                    <li className="flex items-center gap-2">✅ Trusted Retail Network Across Tamil Nadu</li>
                    <li className="flex items-center gap-2">✅ Fast Quotation & Order Processing</li>
                </ul>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-2">
                    {/* RIGHT FORM */}
                    <div className="bg-white rounded-[30px] border border-gray-200 shadow-2xl p-6 md:p-8">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Our Corporate Team</h2>
                            <p className="text-gray-500 text-sm md:text-base">Fill in your business requirements and our corporate solutions team will get in touch with you shortly.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

                            {/* Contact Person Name */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Contact Person Name *</label>
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
                            {/* Bussiness Type */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Business Type *</label>
                                <select name="business_type" value={form.business_type} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.business_type && touched.business_type
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Select Business Type</option>
                                    <option value="Corporate Office">Corporate Office</option>
                                    <option value="Dealer / Reseller">Dealer / Reseller</option>
                                    <option value="Builder / Contractor">Builder / Contractor</option>
                                    <option value="Institution">Institution</option>
                                    <option value="Hotel / Hospitality">Hotel / Hospitality</option>
                                    <option value="Retail Business">Retail Business</option>
                                    <option value="Government">Government</option>
                                    <option value="Others">Others</option>
                                </select>
                                {errors.business_type && touched.business_type && (
                                    <p className="text-red-500 text-sm mt-1">
                                    {errors.business_type}
                                    </p>
                                )}
                            </div>

                            {/* Requirement Caregory */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">Requirement Category *</label>
                                <select name="requirement_category" value={form.requirement_category} onChange={handleChange} onBlur={handleBlur} className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all ${
                                    errors.requirement_category && touched.requirement_category
                                        ? "border-red-500"
                                        : "border-gray-300"
                                    }`}
                                >
                                    <option value="">Select Requirement Category</option>
                                    <option value="Air Conditioners">Air Conditioners</option>
                                    <option value="Televisions">Televisions</option>
                                    <option value="Refrigerators">Refrigerators</option>
                                    <option value="Washing Machines">Washing Machines</option>
                                    <option value="Mobiles">Mobiles</option>
                                    <option value="Kitchen Appliances">Kitchen Appliances</option>
                                    <option value="Corporate Gifting">Corporate Gifting</option>
                                    <option value="Multi-Category Requirement">Multi-Category Requirement</option>
                                </select>
                                {errors.requirement_category && touched.requirement_category && (
                                    <p className="text-red-500 text-sm mt-1">
                                    {errors.requirement_category}
                                    </p>
                                )}
                            </div>

                            {/* GST Number */}
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-700">GST Number (Optional)</label>
                                <input type="text" name="gst_number" value={form.gst_number} onChange={handleChange} onBlur={handleBlur} placeholder="Enter GST number" className={`${inputClass} h-12 rounded-xl border bg-gray-50 focus:bg-white transition-all`}/>
                            </div>
                            

                            {/* Address
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
                            Landmark
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
                            State
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
                            Pincode
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
                            </div> */}

                            {/* Product Details */}
                            <div className="col-span-1 md:col-span-2 mt-1">
                                {/* <label className="block text-sm font-semibold mb-1 text-gray-700">Product Details *</label> */}
                                <div className="space-y-4">
                                    {products.map((product, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end">
                                            {/* Product Name */}
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-700">Product / Requirement</label>
                                                <input type="text" placeholder="Enter product name" value={product.product_name} onChange={(e) =>handleProductChange(
                                                    index,
                                                    "product_name",
                                                    e.target.value
                                                )}
                                                className={`w-full h-12 rounded-2xl border bg-gray-50 px-4 focus:outline-none focus:bg-white ${
                                                errors.products?.[index]?.product_name
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                                }`}/>
                                                {errors.products?.[index]?.product_name && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                    {errors.products[index].product_name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Product Quantity */}
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-700">Approx Quantity *</label>
                                                <input type="number" placeholder="Enter quantity" value={product.product_quantity} onChange={(e) =>handleProductChange(
                                                    index,
                                                    "product_quantity",
                                                    e.target.value
                                                )}
                                                className={`w-full h-12 rounded-2xl border bg-gray-50 px-4 focus:outline-none focus:bg-white ${
                                                errors.products?.[index]?.product_quantity
                                                    ? "border-red-500"
                                                    : "border-gray-300"
                                                }`}/>
                                                {errors.products?.[index]?.product_quantity && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                    {errors.products[index].product_quantity}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {/* Add Button */}
                                            <button type="button" onClick={addProductRow} className="h-12 w-12 rounded-2xl bg-black text-white text-3xl flex items-center justify-center">+</button>
                                            {/* Delete Button */}
                                            {products.length > 1 && (
                                                <button type="button" onClick={() => removeProductRow(index)} className="h-12 w-12 rounded-2xl bg-red-500 text-white text-3xl flex items-center justify-center">×</button>
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
                                    {loading ? "Submitting..." : "Get Corporate Pricing"}
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

            
        </>
    );
}
