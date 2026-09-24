"use client";

import { useState } from "react";
import Link from "next/link";
import "./bajaj-finance.css";

export default function BajajFinancePage() {
  const [activeTab, setActiveTab] = useState("homepage");
  const [leadModal, setLeadModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const openLeadModal = (e) => {
    e.preventDefault();
    setLeadModal(true);
    setSubmitted(false);
    setErrorMsg("");
  };

  const closeLeadModal = () => {
    setLeadModal(false);
    setSubmitted(false);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const form = e.currentTarget;
    const name = form.leadName?.value?.trim() || "";
    const phone = form.leadPhone?.value?.trim() || "";
    const category = form.leadCategory?.value || "";

    const message = `From Bajaj Finance - Interested in: ${category}`;

    try {
      const response = await fetch("/api/contact/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          mobile_number: phone,
          email_address: "bajajfinance@bharathelectronics.in",
          city: "Bajaj Finance",
          message: message,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || "Failed to submit. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting contact lead:", err);
      setErrorMsg("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    closeLeadModal();
  };

  return (
    <div className="bajaj-finance-page">
      <main className="wrap">
        {/* ================= HOMEPAGE ================= */}

        <div
          className={`panel ${activeTab === "homepage" ? "active" : ""
            }`}
        >
          <div className="browser">
            <div className="chrome">
              <i className="dot"></i>
              <i className="dot"></i>
              <i className="dot"></i>
            </div>

            <div className="nav">
              <div className="brand">
                BHARATH <b>●</b>
              </div>

              <div className="links">
                <span>TVs</span>
                <span>Refrigerators</span>
                <span>Washing Machines</span>
                <span>Air Conditioners</span>
              </div>

              <Link
                href="/location"
                className="right"
                style={{
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Find a Store
              </Link>
            </div>

            {/* ================= ORIGINAL HOMEPAGE HERO ================= */}

            <div
              className="hero"
              onClick={() => setActiveTab("landing")}
              title="Click banner to open QR landing page"
              style={{ cursor: "pointer" }}
            >
              <div className="copy">
                <div className="eyebrow">
                  BHARATH × BAJAJ FINANCE
                </div>

                <h1>
                  Buy electronics &amp; appliances on EMI at Bharath
                </h1>

                <p>
                  Shopping for a TV, fridge, washing machine or AC? Check
                  your Bajaj Finance EMI Card limit or explore your
                  eligibility before you buy.
                </p>

                <a
                  className="cta"
                  href="#"
                  onClick={openLeadModal}
                >
                  Check my EMI options &nbsp;→
                </a>

                <div className="fine">
                  Mobile number and OTP may be required · Subject to
                  eligibility and Bajaj Finance terms
                </div>
              </div>

              <div className="art">
                <div className="circle">
                  <div className="phone">
                    <div className="tiny">
                      BAJAJ FINANCE
                    </div>

                    <strong>
                      Explore your
                      <br />
                      EMI options
                    </strong>

                    <div className="line"></div>

                    <div className="line short"></div>

                    <div className="mini">
                      CHECK ELIGIBILITY
                    </div>
                  </div>
                </div>

                <div className="pill">
                  Shop now. <span>Plan better.</span>
                </div>
              </div>
            </div>

            <div className="under">
              <span>
                <strong>Placement:</strong> homepage carousel or
                promotional strip (click banner to go to QR landing page)
              </span>
            </div>
          </div>
        </div>

        {/* ================= LANDING PAGE ================= */}

        <div
          className={`panel ${activeTab === "landing" ? "active" : ""
            }`}
        >
          <button
            className="back-banner-btn"
            onClick={() => setActiveTab("homepage")}
          >
            ← Back to Homepage Banner
          </button>

          {/* ================= MOBILE VIEW ================= */}

          <div className="mobile-only-view">
           
            <div className="mobile">

              <div className="mnav">
                <img
                  src="/user/bea-new.png"
                  alt="Bharath Electronics & Appliances"
                  style={{
                    height: "38px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  Need help?
                </span>
              </div>

              <div className="mhero">
                <div className="partner">
                  <img
                    src="/uploads/bajajLogo.png"
                    alt="Bajaj Finserv"
                    style={{
                      height: "42px",
                      width: "auto",
                      maxWidth: "145px",
                      objectFit: "contain",
                      background: "#fff",
                      padding: "4px 8px",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div className="tag">
                  SHOP SMARTER AT BHARATH
                </div>

                <h1>
                  Buy electronics &amp; appliances on EMI at Bharath
                </h1>

                <p>
                  Explore Bajaj Finance EMI options for TVs,
                  refrigerators, washing machines, air conditioners and
                  more at Bharath Electronics & Appliances, Coimbatore.
                  Existing EMI Card customers and new customers can start
                  using our Bharath × Bajaj Finance QR.
                </p>

                <a
                  className="cta start-journey"
                  href="#"
                  onClick={openLeadModal}
                >
                  Start the Bajaj Finance journey &nbsp;↗
                </a>

                <small>
                  Secure check on Bajaj Finance’s website or approved
                  partner flow
                </small>
              </div>

              <div className="content">
                <div className="qr-card">
                  <h3>
                    Bharath × Bajaj Finance QR
                  </h3>

                  <p>
                    Scan this QR to check your Bajaj Finance EMI options
                    at Bharath.
                  </p>

                  <img
                    src="/uploads/bajajQR.jpeg"
                    alt="Bajaj Finance QR"
                    className="qr-image"
                  />

                  <small>
                    If you arrived by scanning this QR, simply use the
                    button above.
                  </small>
                </div>

                <h3>
                  How Bajaj Finance EMI works
                </h3>

                <div className="step">
                  <span className="number">1</span>

                  <span>
                    <strong>
                      Continue to Bajaj Finance
                    </strong>

                    Open the official eligibility or account journey.
                  </span>
                </div>

                <div className="step">
                  <span className="number">2</span>

                  <span>
                    <strong>
                      Verify your mobile number
                    </strong>

                    Follow the steps shown, which may include OTP and
                    other checks.
                  </span>
                </div>

                <div className="step">
                  <span className="number">3</span>

                  <span>
                    <strong>
                      Shop at Bharath
                    </strong>

                    Ask our team to explain eligible EMI plans and
                    charges before checkout.
                  </span>
                </div>

                <div className="note">
                  <strong>
                    Shopping at Bharath?
                  </strong>

                  Show the result to our Bajaj Finance desk team. They
                  can explain the available instalment plan and
                  applicable charges. An offer or available limit does
                  not guarantee approval for a specific purchase.
                </div>

                <div className="seo-copy">
                  <h3>
                    Already have an EMI Card?
                  </h3>

                  <p>
                    Use your registered mobile number and OTP. If your
                    Bajaj Finance EMI Network Card is active, choose a
                    product category, brand and model, enter the product
                    price and requested loan amount, then review the
                    available EMI scheme. Complete the authorisation on
                    your phone and show the result to the store
                    representative.
                  </p>

                  <h3>
                    New to Bajaj Finance?
                  </h3>

                  <p>
                    Use a mobile number linked to your bank and Aadhaar,
                    then complete the OTP check. Choose the appliance you
                    want and provide the requested personal and product
                    details. The journey may ask for PAN and Aadhaar
                    based identity verification before an offer is
                    generated.
                  </p>

                  <h3>
                    Frequently asked questions
                  </h3>

                  <details>
                    <summary>
                      Can I use this QR if I already have a Bajaj Finance
                      EMI Card?
                    </summary>

                    <p>
                      Yes. Active EMI Card and virtual card customers can
                      start the product and EMI scheme selection journey
                      using the dealer QR. If the card is blocked or KYC
                      needs updating, speak to the Bajaj Finance
                      representative at the store.
                    </p>
                  </details>

                  <details>
                    <summary>
                      Can a new customer apply through the QR?
                    </summary>

                    <p>
                      Yes. New customers can check eligibility and
                      complete the steps shown in Bajaj Finance’s
                      journey. An offer depends on verification and
                      eligibility.
                    </p>
                  </details>

                  <details>
                    <summary>
                      Which products can I buy on EMI at Bharath?
                    </summary>

                    <p>
                      Ask our team about eligible TVs, refrigerators,
                      washing machines, air conditioners and other
                      electronics or appliances. Available plans depend
                      on the selected product and Bajaj Finance terms.
                    </p>
                  </details>

                  <details>
                    <summary>
                      Does scanning the QR approve my purchase?
                    </summary>

                    <p>
                      No. Scanning starts the process. Bajaj Finance
                      determines any offer and final financing decision.
                      Our store team can help complete the purchase after
                      the on-phone steps.
                    </p>
                  </details>

                  <details>
                    <summary>
                      Do I need to share my OTP with Bharath staff?
                    </summary>

                    <p>
                      No. Enter the OTP only in the Bajaj Finance journey
                      on your own phone. Our staff will not ask you to
                      tell them the OTP.
                    </p>
                  </details>

                  <details>
                    <summary>
                      Can Bharath call me about a product and EMI plan?
                    </summary>

                    <p>
                      Yes, you may optionally request a callback and give
                      Bharath permission to contact you. You can also
                      continue to Bajaj Finance without submitting a
                      callback request.
                    </p>
                  </details>
                </div>
              </div>

              <div className="mfooter">
                Eligibility, offers, fees and financing decisions are
                determined by Bajaj Finance Limited. Check applicable
                terms before proceeding.
              </div>
            </div>
          </div>

          {/* ================= DESKTOP VIEW ================= */}

          <div className="desktop-only-view">
         

            <div className="browser">
              <div className="chrome">
                <i className="dot"></i>
                <i className="dot"></i>
                <i className="dot"></i>
              </div>

              <div className="nav">
                <img
                  src="/user/bea-new.png"
                  alt="Bharath Electronics & Appliances"
                  style={{
                    height: "46px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />

                <div className="links">
                  <span>TVs</span>
                  <span>Refrigerators</span>
                  <span>Washing Machines</span>
                  <span>Air Conditioners</span>
                </div>

                <div className="right">
                  Need help?
                </div>
              </div>

              <div className="desk-hero">
                <div>
                  <div className="desk-logo-row">
                    <img
                      src="/uploads/bajajLogo.png"
                      alt="Bajaj Finserv"
                      style={{
                        height: "48px",
                        width: "auto",
                        maxWidth: "180px",
                        objectFit: "contain",
                        background: "#fff",
                        padding: "4px 10px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  <div
                    className="eyebrow"
                    style={{ marginTop: "26px" }}
                  >
                    BAJAJ FINANCE EMI AT BHARATH
                  </div>

                  <h1>
                    Buy electronics &amp; appliances on EMI at Bharath
                  </h1>

                  <p>
                    Explore Bajaj Finance EMI options for TVs,
                    refrigerators, washing machines, air conditioners and
                    more at Bharath Electronics &amp; Appliances. Existing
                    EMI Card customers and new customers can start the
                    journey from this page.
                  </p>

                  <a
                    className="cta start-journey"
                    href="#"
                    onClick={openLeadModal}
                  >
                    Start the Bajaj Finance journey &nbsp;↗
                  </a>

                  <div className="fine">
                    If you reached this page by scanning a product sticker,
                    use the button above.
                  </div>
                </div>

                <div className="desk-qr">
                  <strong>
                    Scan to start on your phone
                  </strong>

                  <p>
                    Use the Bharath × Bajaj Finance QR to open the journey
                    on your mobile.
                  </p>

                  <img
                    src="/uploads/bajajQR.jpeg"
                    alt="Bajaj Finance QR"
                    className="qr-image"
                  />

                  <p>
                    For desktop visitors; no second scan needed if you are
                    already on your phone.
                  </p>
                </div>
              </div>

              <div className="desk-columns">
                <article>
                  <h3>
                    Already have an EMI Card?
                  </h3>

                  <p>
                    Sign in with your registered mobile number and OTP. If
                    your EMI Network Card is active, select the category,
                    brand and model you want to buy.
                  </p>

                  <p>
                    Enter the product price and requested loan amount,
                    review an available EMI scheme, and complete
                    authorisation on your phone. Show the result to our
                    store representative.
                  </p>

                  <p>
                    If your card is blocked or KYC needs updating, ask our
                    Bajaj Finance desk team for help.
                  </p>
                </article>

                <article>
                  <h3>
                    New to Bajaj Finance?
                  </h3>

                  <p>
                    Verify your mobile number with an OTP, then select
                    your product and enter the requested details.
                  </p>

                  <p>
                    The journey may ask for income, PAN and Aadhaar based
                    identity verification before an offer is generated.
                    Show the result to our team to continue your purchase.
                  </p>

                  <p>
                    Any offer or approval is subject to Bajaj Finance
                    eligibility checks and terms.
                  </p>
                </article>
              </div>

              <div className="desk-bottom">
                <h3>
                  Questions about Bajaj Finance EMI?
                </h3>

                <details>
                  <summary>
                    Can I use this QR if I already have an EMI Card?
                  </summary>

                  <p>
                    Yes. Active EMI Card customers can begin selecting a
                    product and available EMI scheme. If the card is
                    blocked, ask our store team for help.
                  </p>
                </details>

                <details>
                  <summary>
                    Can new customers check eligibility?
                  </summary>

                  <p>
                    Yes. Follow the Bajaj Finance journey to verify your
                    details and check for an offer.
                  </p>
                </details>

                <details>
                  <summary>
                    Does scanning guarantee approval?
                  </summary>

                  <p>
                    No. Bajaj Finance determines eligibility, offers and
                    final financing decisions.
                  </p>
                </details>

                <details>
                  <summary>
                    Does Bharath need my OTP or PAN?
                  </summary>

                  <p>
                    No. Enter identity and verification details only in
                    the Bajaj Finance journey. You can optionally leave
                    your name and phone number with Bharath for a product
                    callback.
                  </p>
                </details>

                <details>
                  <summary>
                    Can I continue without requesting a callback?
                  </summary>

                  <p>
                    Yes. The callback request is optional and does not
                    affect the Bajaj Finance eligibility journey.
                  </p>
                </details>
              </div>

              <div className="desk-foot">
                Eligibility, offers, fees and financing decisions are
                determined by Bajaj Finance Limited. Review the applicable
                terms before proceeding.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= LEAD MODAL ================= */}

      <div
        className={`lead-modal ${leadModal ? "open" : ""
          }`}
        role="dialog"
        aria-modal="true"
        aria-label="Optional callback request"
      >
        <div className="lead-box">
          <button
            className="lead-close"
            onClick={closeLeadModal}
            aria-label="Close"
          >
            ×
          </button>

          {!submitted ? (
            <>
              <h2>
                Would you like help from Bharath?
              </h2>

              <p>
                Leave your details if you would like our team to call
                about a product and available EMI plans. This step is
                optional.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor="leadName">
                  Name
                </label>

                <input
                  id="leadName"
                  name="leadName"
                  autoComplete="name"
                  required
                  placeholder="Your name"
                />

                <label htmlFor="leadPhone">
                  Mobile number
                </label>

                <input
                  id="leadPhone"
                  name="leadPhone"
                  autoComplete="tel"
                  inputMode="tel"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  placeholder="10-digit number"
                />

                <label htmlFor="leadCategory">
                  Interested in
                </label>

                <select id="leadCategory" name="leadCategory">
                  <option>TV</option>
                  <option>Refrigerator</option>
                  <option>Washing machine</option>
                  <option>Air conditioner</option>
                  <option>Other appliance</option>
                </select>

                <label className="consent">
                  <input type="checkbox" required />

                  <span>
                    I agree that Bharath Electronics &amp; Appliances may
                    call me about my selected product and EMI options. I
                    can withdraw this request later.{" "}
                    <u>Privacy notice</u>
                  </span>
                </label>

                {errorMsg && (
                  <p style={{ color: "#dc2626", fontSize: "12px", margin: "8px 0", fontWeight: 700 }}>
                    {errorMsg}
                  </p>
                )}

                <div className="lead-actions">
                  <button type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Submitting..." : "Request a callback"}
                  </button>

                  <a onClick={handleSkip}>
                    Continue without callback ↗
                  </a>
                </div>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <div style={{ fontSize: "32px", color: "#246b43", marginBottom: "8px" }}>✓</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0b2a5b", margin: "0 0 8px" }}>
                Request Submitted
              </h3>
              <p
                style={{
                  fontWeight: 600,
                  color: "#246b43",
                  fontSize: "13px",
                  margin: "0 0 18px",
                }}
              >
                Thank you! Your details have been sent. Our team will contact you shortly regarding your Bajaj Finance EMI options.
              </p>
              <button
                type="button"
                onClick={closeLeadModal}
                style={{
                  background: "#0b2a5b",
                  color: "#fff",
                  border: 0,
                  borderRadius: "8px",
                  padding: "10px 22px",
                  fontWeight: 800,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}