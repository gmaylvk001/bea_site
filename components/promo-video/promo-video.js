"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PromoVideoComponent() {
  const [form, setForm] = useState({
    name: "",
    email_address: "",
    mobile_number: "",
    city: "",
    product: "",
    interest: "",
    _hp: "",
  });
  const [formLoadTime] = useState(() => Date.now());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");
  const [statusType, setStatusType] = useState(""); // "success" | "error"
  const [touched, setTouched] = useState({});

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile_number") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, [name]: digits }));
      setTouched((prev) => ({ ...prev, mobile_number: true }));
      if (!digits) {
        setErrors((prev) => ({ ...prev, mobile_number: "Mobile number is required" }));
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        setErrors((prev) => ({ ...prev, mobile_number: "Enter a valid 10-digit mobile number" }));
      } else {
        setErrors((prev) => {
          const { mobile_number: _, ...rest } = prev;
          return rest;
        });
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const { [name]: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";

    if (!form.mobile_number.trim()) {
      newErrors.mobile_number = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.mobile_number.trim())) {
      newErrors.mobile_number = "Enter a valid 10-digit mobile number";
    }

    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.product.trim()) newErrors.product = "Please select a product category";

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    setTouched(allTouched);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatusType("error");
      setResponseMsg("Please complete all required fields with valid details.");
      return;
    }

    // Honeypot check — bots fill hidden fields, humans don't
    if (form._hp) return;

    // Timing check — bots submit too fast
    if (Date.now() - formLoadTime < 3000) {
      setStatusType("error");
      setResponseMsg("Please take a moment before submitting.");
      return;
    }

    setLoading(true);
    setResponseMsg("");
    setStatusType("");

    const productPayload = form.interest?.trim()
      ? `${form.product} (${form.interest.trim()})`
      : form.product;
    const emailPayload = form.email_address?.trim()
      ? form.email_address.trim()
      : `${form.mobile_number.trim()}@enquiry.bharathelectronics.in`;

    try {
      const res = await fetch("/api/promo-video/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          mobile_number: form.mobile_number.trim(),
          email_address: emailPayload,
          city: form.city.trim(),
          product: productPayload,
          _hp: form._hp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const Promovideo = data.data;

        // Trigger email notification
        try {
          const adminemailFormData = new FormData();
          adminemailFormData.append("campaign_id", "0790ce5c-7017-4006-b3b7-9861ef84c8b8");
          adminemailFormData.append(
            "params",
            JSON.stringify([
              Promovideo.name,
              Promovideo.mobile_number,
              Promovideo.email_address,
              Promovideo.city,
              Promovideo.product,
            ])
          );

          const emailadmin = [
            "arunkarthik@bharathelectronics.in",
            "ecom@bharathelectronics.in",
            "Customercare@bharathelectronics.in",
          ];
          emailadmin.forEach(async (email) => {
            try {
              adminemailFormData.set("email", email);
              await fetch("https://bea.eygr.in/api/email/send-msg", {
                method: "POST",
                headers: {
                  Authorization: "Bearer 2|DC7TldSOIhrILsnzAf0gzgBizJcpYz23GHHs0Y2L",
                },
                body: adminemailFormData,
              });
            } catch (err) {
              console.error("Email send failed:", err);
            }
          });
        } catch (e) {
          console.error("Email notification dispatch error:", e);
        }

        setStatusType("success");
        setResponseMsg("Thank you! Your enquiry has been submitted. Our team will contact you shortly.");
        setForm({
          name: "",
          email_address: "",
          mobile_number: "",
          city: "",
          product: "",
          interest: "",
          _hp: "",
        });
        setErrors({});
        setTouched({});
      } else {
        setStatusType("error");
        setResponseMsg(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setStatusType("error");
      setResponseMsg("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="bea-promo-page" id="top">
      {/* TOP CAMPAIGN BANNER */}
      <section className="campaign-banner">
        <img
          src="/uploads/Banner_test.webp"
          alt="Campaign Banner"
          onError={(e) => {
            e.currentTarget.src = "/uploads/promo-video-default.jpg";
          }}
        />
      </section>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="container hero-grid">
          {/* LEFT CONTENT */}
          <div className="hero-left">
            <div className="eyebrow">Exclusive in-store & online enquiries</div>
            <h1>
              Find the right appliance.
              <br />
              <em>Get great offers.</em>
            </h1>
            <p className="hero-copy">
              Looking for a TV, refrigerator, washing machine, AC or more? Share what you're interested in and let our team help you explore available offers.
            </p>
            <div className="benefits">
              <div className="benefit">
                <span className="tick">✓</span> Top brands, one place
              </div>
              <div className="benefit">
                <span className="tick">✓</span> Personalised assistance
              </div>
              <div className="benefit">
                <span className="tick">✓</span> Easy enquiry process
              </div>
            </div>
          </div>

          {/* RIGHT FORM CARD */}
          <div className="offer-card" id="lead-form">
            <h2>Get special offers</h2>
            <p className="form-desc">Fill in your details, our team will contact you.</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="fields">
                {/* Full Name */}
                <div className="field">
                  <label htmlFor="name">
                    Full name <span className="required">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your name"
                    maxLength={80}
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.name && touched.name ? "has-error" : ""}
                    required
                  />
                  {errors.name && touched.name && (
                    <span className="field-error">{errors.name}</span>
                  )}
                </div>

                {/* Mobile Number */}
                <div className="field">
                  <label htmlFor="phone">
                    Mobile number <span className="required">*</span>
                  </label>
                  <input
                    id="phone"
                    name="mobile_number"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    placeholder="10-digit number"
                    value={form.mobile_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.mobile_number && touched.mobile_number ? "has-error" : ""}
                    required
                  />
                  {errors.mobile_number && touched.mobile_number && (
                    <span className="field-error">{errors.mobile_number}</span>
                  )}
                </div>

                {/* City */}
                <div className="field">
                  <label htmlFor="city">
                    City <span className="required">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Your city"
                    maxLength={80}
                    value={form.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.city && touched.city ? "has-error" : ""}
                    required
                  />
                  {errors.city && touched.city && (
                    <span className="field-error">{errors.city}</span>
                  )}
                </div>

                {/* Product Category */}
                <div className="field">
                  <label htmlFor="category">
                    Product category <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="product"
                    value={form.product}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.product && touched.product ? "has-error" : ""}
                    required
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    <option value="Televisions">Televisions</option>
                    <option value="Refrigerators">Refrigerators</option>
                    <option value="Washing Machines">Washing Machines</option>
                    <option value="Air Conditioners">Air Conditioners</option>
                    <option value="Dishwashers">Dishwashers</option>
                    <option value="Small Appliances">Small Appliances</option>
                    <option value="Mobiles & Accessories">Mobiles & Accessories</option>
                    <option value="Laptops & Computers">Laptops & Computers</option>
                    <option value="Audio">Audio</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.product && touched.product && (
                    <span className="field-error">{errors.product}</span>
                  )}
                </div>

                {/* Preferred brand / model (optional) */}
                <div className="field full">
                  <label htmlFor="interest">
                    Preferred brand / model <span style={{ color: "#8594a7", fontWeight: 500 }}>(optional)</span>
                  </label>
                  <input
                    id="interest"
                    name="interest"
                    type="text"
                    maxLength={120}
                    placeholder="e.g. Samsung 55-inch TV or LG washing machine"
                    value={form.interest}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Honeypot field (hidden) */}
              <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                <input
                  type="text"
                  name="_hp"
                  value={form._hp}
                  onChange={handleChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              {/* Submit button */}
              <button type="submit" disabled={loading} className="submit">
                {loading ? "Submitting..." : (
                  <>
                    Submit <span>→</span>
                  </>
                )}
              </button>

              {/* Status Notice */}
              {responseMsg && (
                <div
                  className={`notice ${statusType}`}
                  role="status"
                  aria-live="polite"
                >
                  {responseMsg}
                </div>
              )}

              <p className="after-submit">Your details stay private · Enquiry only</p>
            </form>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="steps-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="kicker">Simple process</span>
            <h2>How it works</h2>
            <p>Three quick steps to start exploring your next purchase.</p>
          </div>
          <div className="steps">
            <article className="step">
              <span className="step-num">01</span>
              <h3>Share your requirement</h3>
              <p>Tell us which product category, brand or model you are looking for.</p>
            </article>
            <article className="step">
              <span className="step-num">02</span>
              <h3>Our team contacts you</h3>
              <p>A BEA representative can discuss your requirements and available options.</p>
            </article>
            <article className="step">
              <span className="step-num">03</span>
              <h3>Explore suitable offers</h3>
              <p>Compare available products, payment options and offers before you decide.</p>
            </article>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bottom-cta">
        <div className="container">
          <div className="cta-shell">
            <div>
              <h2>Contact Us For More Details</h2>
              <p>Have questions? Our team is here to help you.</p>
            </div>
            <Link href="/contact" className="cta-button">
              Click Here!
            </Link>
          </div>
        </div>
      </section>

      {/* SCROLL TO TOP FLOATING BUTTON */}
      <a href="#top" className="float-top" aria-label="Back to top" onClick={scrollToTop}>
        ↑
      </a>

      {/* COMPONENT STYLES */}
      <style jsx>{`
        .bea-promo-page {
          --blue: #1853c8;
          --deep: #09285c;
          --ink: #132a4c;
          --muted: #67778e;
          --orange: #ff853c;
          --sky: #eef5ff;
          --line: #dfe7f2;
          --white: #fff;
          --radius: 18px;
          --shadow: 0 16px 50px rgba(16, 49, 101, 0.1);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
          color: var(--ink);
          background: #fff;
          line-height: 1.55;
          position: relative;
        }

        .container {
          max-width: 1192px;
          padding: 0 26px;
          margin: 0 auto;
        }

        .campaign-banner {
          width: 100%;
          line-height: 0;
          background: #f2f6fd;
          overflow: hidden;
        }

        .campaign-banner img {
          width: 100%;
          height: auto;
          display: block;
        }

        .hero {
          background: linear-gradient(115deg, #eef5ff 0%, #f5f9ff 54%, #fff9f3 100%);
          padding: 66px 0 71px;
          position: relative;
          overflow: hidden;
        }

        .hero:before {
          content: "";
          position: absolute;
          top: -200px;
          right: -120px;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          border: 90px solid rgba(45, 110, 211, 0.035);
          pointer-events: none;
        }

        .hero-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 475px;
          align-items: center;
          gap: 70px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: #fff;
          border: 1px solid #dbe7f7;
          border-radius: 100px;
          color: var(--blue);
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.035em;
          text-transform: uppercase;
        }

        .eyebrow:before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--orange);
        }

        h1 {
          font-size: clamp(36px, 4.3vw, 59px);
          letter-spacing: -0.052em;
          line-height: 1.1;
          margin: 23px 0 21px;
          color: var(--deep);
          font-weight: 850;
        }

        h1 em {
          color: var(--blue);
          font-style: normal;
        }

        .hero-copy {
          font-size: 17px;
          line-height: 1.78;
          color: #586d88;
          max-width: 490px;
          margin: 0;
        }

        .benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 13px 22px;
          margin-top: 28px;
        }

        .benefit {
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 7px;
          color: #254365;
          font-weight: 650;
        }

        .tick {
          width: 19px;
          height: 19px;
          background: #ddf4e8;
          color: #13824c;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 900;
        }

        .offer-card {
          background: #fff;
          border: 1px solid #e3ebf5;
          border-radius: 22px;
          box-shadow: var(--shadow);
          padding: 30px 31px 27px;
          position: relative;
        }

        .offer-card h2 {
          font-size: 26px;
          color: var(--deep);
          letter-spacing: -0.035em;
          line-height: 1.2;
          margin: 0 0 6px;
          font-weight: 800;
        }

        .form-desc {
          color: var(--muted);
          font-size: 13px;
          margin: 0 0 24px;
        }

        .fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 15px;
          row-gap: 17px;
          margin-bottom: 24px;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          font-size: 12px;
          font-weight: 750;
          color: #263d5c;
          display: block;
          margin-bottom: 7px;
        }

        .required {
          color: #e76d3d;
        }

        .field input,
        .field select {
          width: 100%;
          border: 1px solid #dbe3ee;
          border-radius: 9px;
          background: white;
          color: #172d49;
          outline: none;
          padding: 12px 13px;
          font-size: 13px;
          min-height: 45px;
          transition: box-shadow 0.2s, border-color 0.2s;
          box-sizing: border-box;
        }

        .field input::placeholder {
          color: #a0adbd;
        }

        .field input:focus,
        .field select:focus {
          border-color: #316ede;
          box-shadow: 0 0 0 3px #dfeaff;
        }

        .field input.has-error,
        .field select.has-error {
          border-color: #ef4444;
          background-color: #fffaf9;
        }

        .field-error {
          color: #ef4444;
          font-size: 11px;
          margin-top: 4px;
          display: block;
        }

        .submit {
          width: 100%;
          border: 0;
          background: var(--blue);
          color: #fff;
          font-size: 14px;
          font-weight: 750;
          border-radius: 10px;
          padding: 13px 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s;
          box-shadow: 0 8px 20px rgba(24, 83, 200, 0.25);
          cursor: pointer;
        }

        .submit:hover {
          background: #1344a8;
        }

        .submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .after-submit {
          font-size: 11px;
          color: #8a9bb1;
          text-align: center;
          margin: 13px 0 0;
        }

        .notice {
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          padding: 10px 14px;
          border-radius: 9px;
          margin-top: 14px;
        }

        .notice.success {
          background: #ddf4e8;
          color: #13824c;
          border: 1px solid #bcead1;
        }

        .notice.error {
          background: #fde8e8;
          color: #c81e1e;
          border: 1px solid #f8b4b4;
        }

        .steps-section {
          background: #f7faff;
          border-top: 1px solid #ecf0f7;
          border-bottom: 1px solid #ecf0f7;
          padding: 64px 0 72px;
        }

        .section-header {
          text-align: center;
          max-width: 620px;
          margin: 0 auto 44px;
        }

        .kicker {
          font-size: 11px;
          font-weight: 850;
          color: var(--blue);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .section-header h2 {
          font-size: clamp(28px, 3.5vw, 38px);
          letter-spacing: -0.035em;
          color: var(--deep);
          margin: 12px 0 10px;
          font-weight: 850;
        }

        .section-header p {
          color: #73849b;
          font-size: 15px;
          margin: 0;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .step {
          background: #fff;
          border: 1px solid #e5ebf5;
          border-radius: 20px;
          padding: 32px 28px;
          min-height: 190px;
          box-shadow: 0 4px 20px rgba(16, 49, 101, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .step:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(16, 49, 101, 0.06);
        }

        .step-num {
          display: inline-grid;
          place-items: center;
          background: #eaf2ff;
          color: var(--blue);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-weight: 800;
          font-size: 13px;
        }

        .step h3 {
          color: var(--deep);
          font-size: 17px;
          margin: 18px 0 9px;
          font-weight: 750;
        }

        .step p {
          color: #718097;
          font-size: 14px;
          margin: 0;
          line-height: 1.65;
        }

        .bottom-cta {
          padding: 50px 0 65px;
        }

        .cta-shell {
          background: var(--deep);
          color: #fff;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          padding: 34px 44px;
        }

        .cta-shell h2 {
          font-size: 25px;
          letter-spacing: -0.03em;
          margin: 0 0 6px;
          font-weight: 750;
        }

        .cta-shell p {
          font-size: 14px;
          color: #bfd0ec;
          margin: 0;
        }

        .cta-button {
          background: #fff;
          color: var(--deep);
          font-size: 14px;
          font-weight: 850;
          padding: 14px 26px;
          border-radius: 12px;
          white-space: nowrap;
          display: inline-block;
          text-decoration: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }

        .float-top {
          position: fixed;
          bottom: 23px;
          right: 22px;
          background: #fff;
          border: 1px solid #dbe5f3;
          color: #1b58ba;
          box-shadow: 0 6px 20px #102a4a16;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          font-size: 21px;
          z-index: 50;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .float-top:hover {
          background: #f0f6ff;
          border-color: #bcd4f5;
        }

        @media (max-width: 950px) {
          .hero-grid {
            grid-template-columns: 1fr 440px;
            gap: 27px;
          }
        }

        @media (max-width: 760px) {
          .container {
            padding: 0 19px;
          }
          .hero {
            padding: 38px 0 42px;
          }
          .hero-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          h1 {
            font-size: 40px;
            max-width: 520px;
          }
          .hero-copy {
            font-size: 15px;
          }
          .offer-card {
            padding: 25px 21px;
          }
          .steps {
            grid-template-columns: 1fr;
            gap: 13px;
          }
          .section-header h2 {
            font-size: 27px;
          }
          .cta-shell {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 430px) {
          .fields {
            grid-template-columns: 1fr;
          }
          .field.full {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
