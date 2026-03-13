"use client";

import { useState, useEffect } from "react";

export default function ContactBEA() {
  const [form, setForm] = useState({
    name: "",
    mobile_number: "",
    email: "",
    city: "",
    job_post: "",
    resume: null,
    _hp: "",
  });
  const [formLoadTime] = useState(() => Date.now());

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [touched, setTouched] = useState({});
  const [fileKey, setFileKey] = useState(0);

  const [jobPositions, setJobPositions] = useState([]);

  useEffect(() => {
    const fetchJobPositions = async () => {
      const res = await fetch("/api/job-position");
      const data = await res.json();
      setJobPositions(data.data || []);
    };
    fetchJobPositions();
  }, []);

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm({ ...form, mobile_number: digits });
      setTouched((prev) => ({ ...prev, mobile_number: true }));
      if (!digits) {
        setErrors((prev) => ({ ...prev, mobile_number: "" }));
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrors((prev) => ({ ...prev, mobile_number: "Invalid Mobile Number" }));
      } else {
        setErrors((prev) => { const { mobile_number: _, ...rest } = prev; return rest; });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowed.includes(file.type)) {
        setErrors({ ...errors, resume: "Only PDF or DOCX files are allowed" });
        setForm({ ...form, resume: null });
        return;
      }

      setErrors({ ...errors, resume: null });
      setForm({ ...form, resume: file });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";

    if (!form.mobile_number.trim()) {
      newErrors.mobile_number = "Contact number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile_number)) {
      newErrors.mobile_number = "Invalid Mobile Number";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.city.trim()) newErrors.city = "City is required";

    if (!form.job_post.trim()) newErrors.job_post = "Please select a job post";

    if (!form.resume) newErrors.resume = "Resume (PDF/DOCX) is required";

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

    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("mobile_number", form.mobile_number);
      body.append("email", form.email);
      body.append("city", form.city);
      body.append("job_post", form.job_post);
      body.append("resume", form.resume);

      const res = await fetch("/api/careers/add", {
        method: "POST",
        body,
      });

      const data = await res.json();

      if (res.ok) {
        setResponseMsg("Submitted successfully!");
        setForm({
          name: "",
          mobile_number: "",
          email: "",
          city: "",
          job_post: "",
          resume: null,
          _hp: "",
        });
        setTouched({});
        setFileKey((k) => k + 1);
      } else {
        setResponseMsg(data.message || "Failed to submit");
      }
    } catch (err) {
      setResponseMsg("Server error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-md px-3 py-2 focus:outline-none ${
      errors[field] ? "border-red-500" : "border-gray-300"
    }`;

  return (
    <>
      {/* 🔥 PROFESSIONAL CONTACT BEA BANNER */}
      <section className="relative w-full h-[220px] md:h-[300px] lg:h-[260px] flex items-center justify-center">
        <img
          src="/uploads/about-bea.png"
          alt="Contact BEA"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">
            BEA Careers
          </h1>
          <p className="mt-2 text-white/90 text-lg">
            Submit your details & upload your resume
          </p>
        </div>
      </section>

      {/* 🔥 MAIN FORM */}
      <div className="max-w-xl mx-auto my-12 bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Share Your Details
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Honeypot — hidden from humans, bots fill it */}
          <input
            type="text"
            name="_hp"
            value={form._hp}
            onChange={handleChange}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Name */}
          <div>
            <label className="block font-medium mb-1">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block font-medium mb-1">
              Contact Number <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="mobile_number"
              value={form.mobile_number}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass("mobile_number")}
            />
            {errors.mobile_number && (
              <p className="text-red-500 text-sm mt-1">
                {errors.mobile_number}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium mb-1">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={inputClass("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
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
              className={inputClass("city")}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city}</p>
            )}
          </div>

          {/* Job Post Dropdown */}
         {/* Job Position Dropdown */}
<div>
  <label className="block font-medium mb-1">
    Job Position <span className="text-red-600">*</span>
  </label>

  <select
    name="job_post"
    value={form.job_post}
    onChange={handleChange}
    className={`${inputClass("job_post")} bg-white`}
  >
    <option value="">-- Select Job Position --</option>

    {jobPositions.length > 0 ? (
      jobPositions
        .filter((job) => job.status === "Active") // Optional: only show active ones
        .map((job) => (
          <option key={job._id} value={job.position_name}>
            {job.position_name}
          </option>
        ))
    ) : (
      <option disabled>Loading...</option>
    )}
  </select>

  {errors.job_post && (
    <p className="text-red-500 text-sm mt-1">{errors.job_post}</p>
  )}
</div>


          {/* Resume Upload */}
          <div>
            <label className="block font-medium mb-1">
              Upload Resume (PDF/DOCX) <span className="text-red-600">*</span>
            </label>
            <input
              key={fileKey}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className={`w-full rounded-md ${errors.resume ? "border border-red-500" : ""}`}
            />

            {errors.resume && (
              <p className="text-red-500 text-sm mt-1">{errors.resume}</p>
            )}

            {form.resume && (
              <p className="text-green-600 mt-1 text-sm">
                Selected: {form.resume.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-md font-semibold text-lg"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

            {responseMsg && (
              <p className="text-center mt-3 font-medium text-green-600">
                {responseMsg}
              </p>
            )}
          </div>

        </form>
      </div>
    </>
  );
}
