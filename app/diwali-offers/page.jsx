"use client";

import { useEffect } from "react";

/**
 * BEA Diwali Knockout Sale page.
 * All CSS classes, IDs, and style tokens are uniquely scoped with 'dwo-'
 * and attached to #bea-diwali-knockout-sale to guarantee zero impact on
 * the global site layout, header, or footer.
 */
const pageStyles = String.raw`
    #bea-diwali-knockout-sale {
      font-family: "Poppins", "Noto Sans Tamil", sans-serif;
      color: var(--ink);
      background: #f7f9fc;
      line-height: 1.5;

      --bea-blue: #2146a5;
      --bea-blue-dark: #123575;
      --bea-orange: #df7000;
      --bea-cream: #fffdf8;
      --ink: #0e2b54;
      --muted: #5f6f82;
      --line: #e8ecf3;
      --card: #ffffff;
      --shadow: 0 12px 30px rgba(24, 52, 101, 0.12);
      --radius: 20px;
      --page-container: min(1280px, calc(100% - 32px));
    }


    .dwo-page-container {
      width: var(--page-container);
      margin: 0 auto;
      min-width: 0;
    }
    #bea-diwali-knockout-sale img {
      display: block;
      max-width: 100%;
    }
    #bea-diwali-knockout-sale a {
      color: inherit;
      text-decoration: none;
    }
    #bea-diwali-knockout-sale button,
    #bea-diwali-knockout-sale input,
    #bea-diwali-knockout-sale select,
    #bea-diwali-knockout-sale textarea {
      font: inherit;
    }

    .dwo-offer-strip {
      background: var(--bea-blue-dark);
      color: #fff;
      text-align: center;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: .1px;
    }

    .dwo-nav-wrap {
      position: sticky;
      top: 0;
      z-index: 30;
      background: rgba(255, 255, 255, .96);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line);
    }

    .dwo-nav {
      width: var(--page-container);
      max-width: none;
      margin: 0 auto;
      min-height: 66px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      padding: 0 20px;
    }

    .dwo-brand {
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      height: 48px;
      background: transparent;
    }

    .dwo-brand img {
      display: block;
      height: 100%;
      width: auto;
      max-width: none;
      background: transparent;
    }

    .dwo-nav-links {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 6px;
    }

    .dwo-nav-links a {
      padding: 9px 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      color: #334a69;
    }

    .dwo-nav-links a:hover {
      background: #eef3ff;
      color: var(--bea-blue);
    }

    .dwo-nav-links .dwo-enquire-link {
      background: var(--bea-blue);
      color: #fff;
    }

    .dwo-banner {
      width: 100%;
      padding: 8px 0 14px;
      background: transparent;
    }

    .dwo-banner-container {
      min-width: 0;
    }

    .dwo-campaign-banner-frame {
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .dwo-campaign-banner-picture {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      min-height: 0;
      margin: 0;
      line-height: 0;
    }

    .dwo-campaign-banner-picture>img {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      min-height: 0;
      object-fit: contain;
      object-position: center;
      margin: 0;
      aspect-ratio: 1600 / 711;
    }

    .dwo-hero {
      background:
        radial-gradient(circle at 12% 12%, rgba(255, 194, 87, .15), transparent 28%),
        radial-gradient(circle at 88% 85%, rgba(33, 70, 165, .08), transparent 25%),
        var(--bea-cream);
      border-bottom: 1px solid #f0ece3;
    }

    .dwo-hero-inner {
      max-width: 1180px;
      margin: 0 auto;
      text-align: center;
      padding: 62px 24px 72px;
    }

    .dwo-welcome {
      margin: 0;
      font-size: clamp(34px, 5.2vw, 66px);
      line-height: 1.08;
      letter-spacing: -2px;
      font-weight: 800;
    }

    .dwo-welcome .orange {
      color: var(--bea-orange);
    }

    .dwo-welcome .blue {
      color: var(--bea-blue);
    }

    .dwo-main-title {
      margin: 8px 0 22px;
      font-size: clamp(42px, 6vw, 78px);
      line-height: 1.06;
      letter-spacing: -2px;
      font-weight: 800;
    }

    .dwo-main-title .bea {
      color: var(--bea-blue);
    }

    .dwo-main-title .festival,
    .dwo-main-title .sale {
      color: var(--bea-orange);
    }

    .dwo-hero-subtitle {
      margin: 0 0 8px;
      font-family: "Noto Sans Tamil", "Poppins", sans-serif;
      font-size: clamp(18px, 2.2vw, 28px);
      font-weight: 600;
      color: #46596e;
    }

    .dwo-hero-copy {
      max-width: 900px;
      margin: 0 auto 10px;
      font-size: clamp(16px, 2vw, 23px);
      color: #40546d;
    }

    .dwo-hero-emphasis {
      margin: 18px auto 34px;
      font-family: "Noto Sans Tamil", "Poppins", sans-serif;
      font-size: clamp(19px, 2.3vw, 28px);
      font-weight: 800;
      color: #0c2d5a;
    }

    .dwo-primary-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 13px;
      min-width: 290px;
      padding: 18px 28px;
      border-radius: 999px;
      background: var(--bea-blue);
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      box-shadow: 0 12px 24px rgba(33, 70, 165, .24);
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .dwo-primary-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 16px 30px rgba(33, 70, 165, .28);
    }

    .dwo-chevron {
      width: 12px;
      height: 12px;
      border-right: 3px solid currentColor;
      border-bottom: 3px solid currentColor;
      transform: rotate(45deg) translateY(-2px);
    }

    .dwo-content-section {
      width: var(--page-container);
      max-width: none;
      margin: 0 auto;
      padding: 68px 20px 18px;
      scroll-margin-top: 78px;
    }

    .dwo-section-heading {
      text-align: center;
      margin-bottom: 28px;
    }

    .dwo-eyebrow {
      display: inline-flex;
      padding: 7px 12px;
      border-radius: 999px;
      background: #fff2de;
      color: #b95a00;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .8px;
      font-weight: 800;
      margin-bottom: 10px;
    }

    .dwo-section-heading h2 {
      margin: 0;
      font-size: clamp(30px, 4vw, 46px);
      line-height: 1.1;
      color: var(--bea-blue-dark);
    }

    .dwo-section-heading p {
      max-width: 700px;
      margin: 10px auto 0;
      color: var(--muted);
    }

    .dwo-product-grid {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: stretch;
      gap: 24px;
      max-width: 1120px;
      margin: 0 auto;
      min-width: 0;
    }

    .dwo-product-card {
      flex: 0 0 calc((100% - 48px) / 3);
      max-width: calc((100% - 48px) / 3);
      overflow: hidden;
      background: var(--card);
      border-radius: var(--radius);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .dwo-product-card .tag {
      display: none;
      /* badge only existed on some sections and covered the creatives */
      position: absolute;
      margin: 14px;
      z-index: 2;
      background: rgba(18, 53, 117, .94);
      color: #fff;
      padding: 7px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 6px 14px rgba(0, 0, 0, .13);
    }

    .dwo-product-image-wrap {
      position: relative;
      aspect-ratio: 1 / 1;
      background: #f6f6f6;
      overflow: hidden;
    }

    .dwo-product-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform .28s ease;
    }

    .dwo-product-card {
      transition: transform .25s ease, box-shadow .25s ease;
    }

    .dwo-product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 38px rgba(24, 52, 101, 0.18);
    }

    .dwo-product-card:hover img {
      transform: scale(1.025);
    }

    .product-

    .dwo-product-body h3 {
      font-size: 15px;
      line-height: 1.4;
      margin: 0;
      min-height: 42px;
      color: #193a6e;
    }

    .dwo-whatsapp-btn {
      margin-top: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      width: 100%;
      min-height: 58px;
      padding: 14px 18px;
      border-radius: 18px;
      background: #15a357;
      color: #ffffff;
      font-weight: 500;
      font-size: 17px;
      line-height: 1.2;
    }

    .dwo-whatsapp-btn::before {
      content: "";
      width: 20px;
      height: 20px;
      flex: 0 0 20px;
      background: center / contain no-repeat url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMy42MDEgMi4zMjZBNy44NSA3Ljg1IDAgMCAwIDcuOTk0IDBDMy42MjcgMCAuMDY4IDMuNTU4LjA2NCA3LjkyNmMwIDEuMzk5LjM2NiAyLjc2IDEuMDU3IDMuOTY1TDAgMTZsNC4yMDQtMS4xMDJhNy45MyA3LjkzIDAgMCAwIDMuNzkuOTY1aC4wMDRjNC4zNjggMCA3LjkyNi0zLjU1OCA3LjkzLTcuOTNBNy45IDcuOSAwIDAgMCAxMy42IDIuMzI2ek03Ljk5NCAxNC41MjFhNi41OCA2LjU4IDAgMCAxLTMuMzYtLjkybC0uMjQtLjE0NC0yLjQ5NC42NTQuNjY2LTIuNDMzLS4xNTYtLjI1YTYuNTYgNi41NiAwIDAgMS0xLjAwNy0zLjUwNWMwLTMuNjI2IDIuOTUtNi41NzYgNi41OTUtNi41NzZhNi41NyA2LjU3IDAgMCAxIDQuNjYgMS45MzEgNi41NiA2LjU2IDAgMCAxIDEuOTI4IDQuNjZjLS4wMDQgMy42MjYtMi45NTQgNi41ODMtNi41OTIgNi41ODNtMy42MTMtNC45M2MtLjE5Ny0uMS0xLjE3LS41NzgtMS4zNTMtLjY0Ni0uMTgyLS4wNjYtLjMxNS0uMS0uNDQ1LjEtLjEzMy4xOTctLjUxNS42NDYtLjYzLjc3OC0uMTE2LjEzMy0uMjMyLjE1LS40My4wNS0uMTk3LS4xLS44MzYtLjMwOC0xLjU5Mi0uOTg0LS41OS0uNTI1LS45ODYtMS4xNy0xLjEwMi0xLjM2OC0uMTE2LS4yLS4wMTMtLjMwNS4wODctLjQwNC4wOS0uMDkuMTk3LS4yMzIuMjk3LS4zNDguMS0uMTE2LjEzMy0uMi4yLS4zMy4wNjYtLjEzMy4wMzMtLjI1LS4wMTctLjM0OC0uMDUtLjEtLjQ0NS0xLjA3NS0uNjEtMS40Ny0uMTYtLjM4OS0uMzIzLS4zMzYtLjQ0NS0uMzQzLS4xMTYtLjAwNi0uMjUtLjAwNi0uMzgyLS4wMDZhLjczLjczIDAgMCAwLS41MjkuMjVjLS4xODIuMTk3LS42OTIuNjc4LS42OTIgMS42NTRzLjcxIDEuOTIuODEgMi4wNTNjLjEuMTMzIDEuMzk3IDIuMTMyIDMuMzgzIDIuOTkyLjQ3My4yMDUuODQyLjMyNyAxLjEzLjQxOC40NzUuMTUxLjkwNy4xMyAxLjI0OC4wNzkuMzgtLjA1NyAxLjE3LS40OCAxLjMzNi0uOTQzLjE2NC0uNDYyLjE2NC0uODYuMTE2LS45NDMtLjA1LS4wODMtLjE4Mi0uMTMzLS4zOC0uMjMyeiIvPjwvc3ZnPg==");
    }


    /* ===== Diwali Knockout Sale lead form ===== */
    .dwo-lead-section {
      width: var(--page-container);
      margin: 62px auto 0;
      padding: 0 20px;
      scroll-margin-top: 128px;
    }

    .dwo-lead-card {
      max-width: 1120px;
      margin: 0 auto;
      padding: 46px 52px 50px;
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 28px;
      box-shadow: var(--shadow);
    }

    .dwo-lead-heading {
      text-align: center;
      margin-bottom: 34px;
    }

    .dwo-lead-heading h2 {
      margin: 0 0 10px;
      color: var(--bea-blue-dark);
      font-size: clamp(30px, 4vw, 44px);
      line-height: 1.15;
      letter-spacing: -.6px;
    }

    .dwo-lead-heading p {
      margin: 0 auto;
      max-width: 760px;
      color: var(--muted);
      font-size: 16px;
    }

    .dwo-lead-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px 28px;
    }

    .dwo-form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
    }

    .dwo-form-group.full {
      grid-column: 1 / -1;
    }

    .dwo-form-group label {
      color: #17365f;
      font-size: 15px;
      font-weight: 700;
    }

    .dwo-form-group input,
    .dwo-form-group select,
    .dwo-form-group textarea {
      width: 100%;
      border: 1px solid #cfd7e3;
      border-radius: 12px;
      background: #fbfcfe;
      color: #17365f;
      padding: 15px 17px;
      font: inherit;
      outline: none;
      transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
    }

    .dwo-form-group input,
    .dwo-form-group select {
      min-height: 56px;
    }

    .dwo-form-group textarea {
      min-height: 130px;
      resize: vertical;
    }

    .dwo-form-group input::placeholder,
    .dwo-form-group textarea::placeholder {
      color: #9aa8ba;
    }

    .dwo-phone-input-shell {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: stretch;
      width: 100%;
      min-height: 56px;
      border: 1px solid #cfd7e3;
      border-radius: 12px;
      background: #fbfcfe;
      overflow: hidden;
      transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
    }

    .dwo-phone-prefix {
      display: flex;
      align-items: center;
      padding: 0 14px 0 17px;
      border-right: 1px solid #d6deea;
      background: #f4f7fb;
      color: #17365f;
      font-weight: 700;
      line-height: 1;
      user-select: none;
      white-space: nowrap;
    }

    .dwo-phone-input-shell:focus-within {
      border-color: var(--bea-blue);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(33, 70, 165, .10);
    }

    .dwo-form-group select:invalid {
      color: #9aa8ba;
    }

    .dwo-form-group input:focus,
    .dwo-form-group select:focus,
    .dwo-form-group textarea:focus {
      border-color: var(--bea-blue);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(33, 70, 165, .10);
    }


    .dwo-form-group .dwo-phone-input-shell input {
      width: 100%;
      min-width: 0;
      min-height: 54px;
      border: 0;
      border-radius: 0;
      background: transparent;
      padding: 0 17px;
      box-shadow: none;
      font-size: 16px;
    }

    .dwo-form-group .dwo-phone-input-shell input:focus {
      border: 0;
      outline: 0;
      background: transparent;
      box-shadow: none;
    }

    .dwo-lead-submit-row {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      padding-top: 12px;
    }

    .dwo-lead-submit {
      min-width: 260px;
      min-height: 56px;
      border: 0;
      border-radius: 999px;
      background: var(--bea-blue);
      color: #fff;
      padding: 14px 26px;
      font: inherit;
      font-size: 16px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 10px 20px rgba(33, 70, 165, .20);
      transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
    }

    .dwo-lead-submit:hover {
      transform: translateY(-1px);
      background: var(--bea-blue-dark);
      box-shadow: 0 14px 26px rgba(33, 70, 165, .24);
    }


    .dwo-faq-section {
      margin-top: 62px;
      background: linear-gradient(135deg, #123575, #2146a5);
      color: white;
    }

    .dwo-faq-inner {
      max-width: 1000px;
      margin: 0 auto;
      padding: 70px 20px;
    }

    .dwo-faq-copy {
      text-align: center;
      max-width: 760px;
      margin: 0 auto 30px;
    }

    .dwo-faq-copy h2 {
      margin: 0 0 8px;
      font-size: clamp(30px, 4vw, 45px);
    }

    .dwo-faq-copy p {
      margin: 0;
      color: rgba(255, 255, 255, .78);
    }

    .dwo-faq-list {
      display: grid;
      gap: 14px;
    }

    .dwo-faq-item {
      background: #fff;
      color: var(--ink);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 12px 28px rgba(0, 0, 0, .14);
    }

    .dwo-faq-item summary {
      list-style: none;
      cursor: pointer;
      padding: 19px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      font-size: 16px;
      font-weight: 700;
      color: #173b72;
    }

    .dwo-faq-item summary::-webkit-details-marker {
      display: none;
    }

    .dwo-faq-item summary::after {
      content: "+";
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #eef3ff;
      color: var(--bea-blue);
      font-size: 22px;
      font-weight: 700;
      line-height: 1;
    }

    .dwo-faq-item[open] summary::after {
      content: "\\2212";
    }

    .dwo-faq-answer {
      padding: 0 22px 20px;
      color: #5b6d84;
      font-size: 14px;
      line-height: 1.7;
    }

    .dwo-faq-answer p {
      margin: 0;
    }

    .dwo-visit-section {
      max-width: 1180px;
      margin: 0 auto;
      padding: 58px 20px;
    }

    .dwo-visit-card {
      background: #fff;
      border: 1px solid var(--line);
      border-radius: 24px;
      box-shadow: var(--shadow);
      padding: 34px;
      text-align: center;
    }

    .dwo-visit-card h2 {
      margin: 0 0 10px;
      color: var(--bea-blue-dark);
    }

    .dwo-visit-card p {
      margin: 0 auto 22px;
      max-width: 800px;
      color: var(--muted);
    }

    .dwo-action-row {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .dwo-action-row a {
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid #cfd8e8;
      background: #fff;
      font-weight: 700;
      color: #21406f;
    }

    .dwo-action-row a:first-child {
      background: var(--bea-blue);
      color: white;
      border-color: var(--bea-blue);
    }
    .dwo-footer {
      background: #0c234d;
      color: rgba(255, 255, 255, .82);
      padding: 24px 20px;
      text-align: center;
      font-size: 13px;
    }
    .dwo-footer a {
      color: #fff;
      font-weight: 600;
    }

    .dwo-footer-links {
      margin-top: 8px;
      display: flex;
      gap: 14px;
      justify-content: center;
      flex-wrap: wrap;
    }

    @media (max-width: 575px) {
      .dwo-page-container {
        width: min(100% - 20px, 1280px);
      }

      .dwo-banner {
        padding-top: 4px;
        padding-bottom: 10px;
      }

      .dwo-campaign-banner-frame {
        border-radius: 20px;
      }

      .dwo-campaign-banner-picture>img {
        aspect-ratio: 1098 / 1433;
      }
    }

    @media (max-width: 980px) {
      .dwo-product-grid {
        gap: 20px;
      }

      .dwo-product-card {
        flex-basis: calc((100% - 20px) / 2);
        max-width: calc((100% - 20px) / 2);
      }

      .dwo-nav {
        align-items: flex-start;
        padding-top: 12px;
        padding-bottom: 12px;
      }

      .dwo-nav-links {
        justify-content: flex-start;
      }
    }

    @media (max-width: 768px) {
      .dwo-offer-strip {
        font-size: 12px;
        padding: 8px 12px;
      }

      .dwo-nav {
        min-height: auto;
        flex-direction: column;
        gap: 10px;
      }

      .dwo-brand {
        height: 42px;
      }

      .dwo-nav-links {
        width: 100%;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 3px;
        scrollbar-width: none;
      }

      .dwo-nav-links::-webkit-scrollbar {
        display: none;
      }

      .dwo-nav-links a {
        white-space: nowrap;
        background: #f5f7fb;
      }

      .dwo-hero-inner {
        padding: 42px 18px 50px;
      }

      .dwo-welcome,
      .dwo-main-title {
        letter-spacing: -1px;
      }

      .dwo-primary-cta {
        min-width: 0;
        width: min(100%, 330px);
        padding: 16px 20px;
      }

      .dwo-content-section {
        padding: 48px 15px 8px;
        scroll-margin-top: 128px;
      }

      .dwo-lead-section {
        width: min(100% - 20px, 1280px);
        padding: 0;
        margin-top: 46px;
      }

      .dwo-lead-card {
        padding: 34px 22px 38px;
        border-radius: 22px;
      }

      .dwo-lead-heading {
        margin-bottom: 26px;
      }

      .dwo-lead-heading p {
        font-size: 15px;
      }

      .dwo-lead-form {
        grid-template-columns: 1fr;
        gap: 18px;
      }

      .dwo-form-group.full,
      .dwo-lead-submit-row {
        grid-column: 1;
      }

      .dwo-lead-submit {
        width: 100%;
        min-width: 0;
      }

      .dwo-product-grid {
        gap: 18px;
      }

      .dwo-faq-section {
        margin-top: 46px;
      }

      .dwo-faq-inner {
        padding: 50px 15px;
      }

      .dwo-faq-item summary {
        padding: 17px 18px;
        font-size: 15px;
      }

      .dwo-faq-answer {
        padding: 0 18px 18px;
      }

      .dwo-visit-card {
        padding: 26px 18px;
      }
    }

    @media (max-width: 430px) {
      .dwo-page-container {
        width: min(100% - 16px, 1280px);
      }

      .dwo-welcome {
        font-size: 31px;
      }

      .dwo-main-title {
        font-size: 38px;
      }

      .dwo-hero-subtitle {
        font-size: 18px;
      }

      .dwo-hero-copy {
        font-size: 15px;
      }

      .dwo-hero-emphasis {
        font-size: 18px;
      }

      .dwo-section-heading h2 {
        font-size: 30px;
      }
    }

    @media (max-width: 360px) {
      .dwo-lead-heading h2 {
        font-size: 24px;
        line-height: 1.18;
        letter-spacing: -.2px;
        overflow-wrap: anywhere;
      }
    }

    @media (max-width: 640px) {
      .dwo-product-card {
        flex-basis: 100%;
        max-width: 480px;
      }
    }
  


    .dwo-deal-browser {
      width: var(--page-container);
      margin: 34px auto 0;
      scroll-margin-top: 90px;
    }

    .dwo-deal-browser-inner {
      width: 100%;
      padding: 0 20px;
    }

    .dwo-deal-browser-copy {
      max-width: 760px;
      margin: 0 auto 22px;
      text-align: center;
    }

    .dwo-deal-browser-kicker {
      display: inline-block;
      margin-bottom: 8px;
      color: #b95a00;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .9px;
      text-transform: uppercase;
    }

    .dwo-deal-browser-copy h2 {
      margin: 0;
      color: var(--bea-blue-dark);
      font-size: clamp(28px, 3.8vw, 42px);
      line-height: 1.12;
    }

    .dwo-deal-browser-copy p {
      margin: 10px auto 0;
      color: var(--muted);
      line-height: 1.6;
    }

    .dwo-category-tabs {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      max-width: 1180px;
      margin: 0 auto;
    }

    .dwo-category-tab {
      appearance: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-width: 0;
      min-height: 76px;
      padding: 14px 14px 12px;
      border: 1px solid #d8e0ed;
      border-radius: 16px;
      background: #fff;
      color: #24436f;
      font: inherit;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s ease, background .2s ease, color .2s ease, transform .2s ease;
    }

    .dwo-category-tab span,
    .dwo-category-tab small {
      display: block;
    }

    .dwo-category-tab span {
      font-size: 15px;
      font-weight: 700;
      line-height: 1.25;
      pointer-events: none;
    }

    .dwo-category-tab small {
      margin-top: 5px;
      color: #71819a;
      font-size: 12px;
      line-height: 1.2;
      pointer-events: none;
    }

    .dwo-category-tab:hover {
      border-color: #8ea6cf;
      transform: translateY(-2px);
    }

    .dwo-category-tab:focus-visible {
      outline: 3px solid rgba(33, 70, 165, .2);
      outline-offset: 2px;
    }

    .dwo-category-tab.is-active {
      border-color: var(--bea-blue);
      background: var(--bea-blue);
      color: #fff;
      box-shadow: inset 0 -4px 0 #ef8a17;
    }

    .dwo-category-tab.is-active small {
      color: rgba(255, 255, 255, .78);
    }

    .dwo-content-section[hidden],
    .dwo-product-card[hidden] {
      display: none !important;
    }

    .dwo-view-more-wrap {
      display: flex;
      justify-content: center;
      margin: 26px 0 0;
    }

    .dwo-view-more-deals {
      min-height: 48px;
      padding: 12px 22px;
      border: 1px solid var(--bea-blue);
      border-radius: 999px;
      background: #fff;
      color: var(--bea-blue-dark);
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background .2s ease, color .2s ease;
    }

    .dwo-view-more-deals:hover,
    .dwo-view-more-deals:focus-visible {
      background: var(--bea-blue);
      color: #fff;
      outline: none;
    }

    .dwo-empty-deals-state {
      max-width: 760px;
      margin: 0 auto;
      padding: 38px 28px;
      border: 1px dashed #b9c7da;
      border-radius: 20px;
      background: #fff;
      text-align: center;
    }

    .dwo-empty-deals-state .dwo-empty-kicker {
      display: block;
      margin-bottom: 8px;
      color: #b95a00;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .7px;
      text-transform: uppercase;
    }

    .dwo-empty-deals-state h3 {
      margin: 0;
      color: var(--bea-blue-dark);
      font-size: 24px;
    }

    .dwo-empty-deals-state p {
      margin: 8px auto 0;
      color: var(--muted);
    }

    @media (max-width: 980px) {
      .dwo-category-tabs {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 760px) {
      .dwo-deal-browser {
        width: 100%;
        margin-top: 26px;
      }

      .dwo-deal-browser-inner {
        padding: 0 15px;
      }

      .dwo-deal-browser-copy {
        margin-bottom: 16px;
      }

      .dwo-deal-browser-copy p {
        font-size: 14px;
      }

      .dwo-category-tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .dwo-category-tab {
        min-height: 70px;
      }
    }

    @media (max-width: 430px) {
      .dwo-deal-browser-copy h2 {
        font-size: 28px;
      }

      .dwo-category-tabs {
        grid-template-columns: 1fr;
      }

      .dwo-empty-deals-state {
        padding: 30px 18px;
      }

      .dwo-empty-deals-state h3 {
        font-size: 21px;
      }
    }
  


    /* Code 1 multi-select + feedback within Code 2 theme */
    .dwo-enquiry-status {
      margin: 0;
      color: #455b75;
      font-size: 14px;
      text-align: center
    }

    .dwo-enquiry-error {
      color: #b42318
    }

    .dwo-enquiry-success {
      padding: 14px 18px;
      border-radius: 12px;
      background: #eaf7ef;
      color: #116638;
      font-weight: 600;
      text-align: center
    }

    .dwo-is-hidden,
    .dwo-dwo-is-hidden {
      display: none !important
    }

    #bea-diwali-knockout-sale .ts-wrapper {
      width: 100%;
      min-width: 0
    }

    #bea-diwali-knockout-sale .ts-wrapper .ts-control {
      border: 1px solid #cfd7e3;
      border-radius: 12px;
      background: #fbfcfe;
      padding: 13px 15px;
      min-height: 56px;
      box-shadow: none;
      gap: 6px
    }

    #bea-diwali-knockout-sale .ts-wrapper.focus .ts-control {
      border-color: var(--bea-blue);
      box-shadow: 0 0 0 3px rgba(33, 70, 165, .10)
    }

    #bea-diwali-knockout-sale .ts-dropdown {
      border-radius: 12px;
      overflow: hidden;
      z-index: 100
    }

    #bea-diwali-knockout-sale .ts-wrapper.multi .ts-control>div {
      background: #eaf0ff;
      color: #173b72;
      border-radius: 6px;
      padding: 5px 8px
    }

    .dwo-nav-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 5px;
      width: 44px;
      height: 44px;
      border: 1px solid #d8e0ed;
      border-radius: 10px;
      background: #fff;
      cursor: pointer
    }

    .dwo-nav-toggle span {
      width: 22px;
      height: 2px;
      border-radius: 3px;
      background: var(--bea-blue-dark)
    }

    @media(max-width:768px) {
      .dwo-nav {
        position: relative;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        min-height: 66px;
        padding: 10px 12px;
        gap: 10px
      }

      .dwo-nav-toggle {
        display: flex;
        margin-left: auto
      }

      .dwo-nav-links {
        display: none;
        flex: 0 0 100%;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 7px;
        overflow: visible;
        padding: 8px 0 10px
      }

      .dwo-nav-links.is-open {
        display: flex
      }

      .dwo-nav-links a {
        display: block;
        white-space: normal;
        padding: 12px 15px;
        border-radius: 10px;
        background: #f5f7fb
      }

      .dwo-nav-links .dwo-enquire-link {
        background: var(--bea-blue);
        color: #fff
      }
    }

    @media(max-width:430px) {
      .dwo-category-tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr))
      }

      .dwo-category-tab {
        padding: 12px 7px
      }

      .dwo-category-tab span {
        font-size: 13px
      }

      .dwo-category-tab small {
        font-size: 11px
      }
    }
  `;

const pageMarkup = String.raw`<noscript><iframe height="0" src="https://www.googletagmanager.com/ns.html?id=GTM-KX9W5L9R" style="display:none;visibility:hidden" width="0"></iframe></noscript>
<div class="dwo-offer-strip">🪔 BEA Diwali Knockout Sale | Knockout Deals | Easy EMIs | Limited Period Offers</div>
<div class="dwo-nav-wrap">
<nav aria-label="Offer categories" class="dwo-nav">
<a aria-label="BEA Home" class="dwo-brand" href="#dwo-top"><img alt="BEA - Always One Step Ahead" height="48" src="logo.png" width="auto"/></a>
<button aria-controls="dwo-mobileMenu" aria-expanded="false" aria-label="Toggle navigation" class="dwo-nav-toggle" id="dwo-mobileMenuToggle" type="button"><span></span><span></span><span></span></button>
<div class="dwo-nav-links" id="dwo-mobileMenu"><a href="#dwo-deal-category-bar">Knockout Deals</a><a class="dwo-enquire-link" href="#dwo-enquiry">Enquire Now</a><a href="#dwo-faq">FAQs</a><a href="https://www.bharathelectronics.in/location" rel="noopener" target="_blank">Showrooms</a></div>
</nav>
</div>
<main id="dwo-top">
<section aria-label="BEA Diwali Knockout Sale Banner" class="dwo-banner">
<div class="dwo-page-container dwo-banner-container">
<div class="dwo-campaign-banner-frame">
<picture class="dwo-campaign-banner-picture">
<source media="(max-width: 575px)" srcset="mob-bnr.jpeg"/>
<img alt="BEA Diwali Knockout Sale Banner" src="/uploads/diwaliCamImages/diwali-offer-top-banner.webp"/>
</picture>
</div>
</div>
</section>
<section aria-labelledby="dwo-deal-browser-title" class="dwo-deal-browser" id="dwo-deal-category-bar">
<div class="dwo-page-container dwo-deal-browser-inner">
<div class="dwo-deal-browser-copy">
<span class="dwo-deal-browser-kicker">Diwali Knockout Sale</span>
<h2 id="dwo-deal-browser-title">Shop Knockout Deals by Category</h2>
<p>Switch categories to see only the offers you want. The product area updates instantly without sending you
            around the page.</p>
</div>
<div aria-label="Product categories" class="dwo-category-tabs" role="tablist">
<button aria-selected="true" class="dwo-category-tab is-active" data-category="tvs" role="tab" type="button"><span>Smart TVs</span><small>12 deals</small></button>
<button aria-selected="false" class="dwo-category-tab" data-category="refrigerators" role="tab" type="button"><span>Refrigerators</span><small>10 deals</small></button>
<button aria-selected="false" class="dwo-category-tab" data-category="washing-machines" role="tab" type="button"><span>Washing Machines</span><small>13 deals</small></button>
<button aria-selected="false" class="dwo-category-tab" data-category="dishwashers" role="tab" type="button"><span>Dishwashers</span><small>3 deals</small></button>
<button aria-selected="false" class="dwo-category-tab" data-category="ac" role="tab" type="button"><span>Air
              Conditioners</span><small>10 deals</small></button>
</div>
</div>
</section>
<section class="dwo-content-section" data-category="tvs" id="dwo-tvs">
<div class="dwo-section-heading">
<h2>Smart TVs</h2>
<p>Explore BEA Diwali Knockout Sale Smart TV offers from leading brands and enquire directly on WhatsApp.</p>
</div>
<div class="dwo-product-grid">
<article class="dwo-product-card" data-deal-index="1">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Haier 55 Inch QLED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV1.webp"/></div>
<div class="dwo-product-body">
<h3>Haier 55 Inch QLED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Haier%2055%20Inch%20QLED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="2">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Sony 65 Inch LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV2.webp"/></div>
<div class="dwo-product-body">
<h3>Sony 65 Inch LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Sony%2065%20Inch%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="3">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Sony 65 Inch LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV3.webp"/></div>
<div class="dwo-product-body">
<h3>Sony 65 Inch LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Sony%2065%20Inch%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="4">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="VZY 55 Inch QLED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV4.webp"/></div>
<div class="dwo-product-body">
<h3>VZY 55 Inch QLED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20VZY%2055%20Inch%20QLED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="5">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="LG 65 Inch OLED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV5.webp"/></div>
<div class="dwo-product-body">
<h3>LG 65 Inch OLED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20LG%2065%20Inch%20OLED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="6">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Sony 85 Inch LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV6.webp"/></div>
<div class="dwo-product-body">
<h3>Sony 85 Inch LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Sony%2085%20Inch%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="7">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Sony 100 Inch LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV7.webp"/></div>
<div class="dwo-product-body">
<h3>Sony 100 Inch LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Sony%20100%20Inch%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="8">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Lloyd 75 Inch QLED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV8.webp"/></div>
<div class="dwo-product-body">
<h3>Lloyd 75 Inch QLED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Lloyd%2075%20Inch%20QLED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="9">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="LG 75 Inch QNED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV9.webp"/></div>
<div class="dwo-product-body">
<h3>LG 75 Inch QNED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20LG%2075%20Inch%20QNED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="10">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Samsung 75 Inch LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV10.webp"/></div>
<div class="dwo-product-body">
<h3>Samsung 75 Inch LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Samsung%2075%20Inch%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="11">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Samsung 65 Inch Mini LED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV11.webp"/></div>
<div class="dwo-product-body">
<h3>Samsung 65 Inch Mini LED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Samsung%2065%20Inch%20Mini%20LED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-deal-index="12">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Haier 100 Inch QLED TV" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/TV/TV12.webp"/></div>
<div class="dwo-product-body">
<h3>Haier 100 Inch QLED TV</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Haier%20100%20Inch%20QLED%20TV%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
</div>
</section>
<section class="dwo-content-section" data-category="refrigerators" hidden="" id="dwo-refrigerators">
<div class="dwo-section-heading">
<h2>Refrigerators</h2>
<p>Explore selected refrigerator deals featured in the BEA Diwali Knockout Sale.</p>
</div>
<div class="dwo-product-grid">
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Whirlpool 245L Direct Cool Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF1.webp"/></div>
<div class="dwo-product-body">
<h3>Whirlpool 245L Direct Cool Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Whirlpool%20245L%20Direct%20Cool%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="LG 466L 2 Star Double Door Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF2.webp"/></div>
<div class="dwo-product-body">
<h3>LG 466L 2 Star Double Door Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20LG%20466L%202%20Star%20Double%20Door%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Haier 355L 2 Star Frost Free Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF3.webp"/></div>
<div class="dwo-product-body">
<h3>Haier 355L 2 Star Frost Free Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Haier%20355L%202%20Star%20Frost%20Free%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Samsung 467L 2 Star Frost Free Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF4.webp"/></div>
<div class="dwo-product-body">
<h3>Samsung 467L 2 Star Frost Free Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Samsung%20467L%202%20Star%20Frost%20Free%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="LG 610L Side By Side Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF5.webp"/></div>
<div class="dwo-product-body">
<h3>LG 610L Side By Side Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20LG%20610L%20Side%20By%20Side%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Godrej 272L 2 Star Frost Free Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF6.webp"/></div>
<div class="dwo-product-body">
<h3>Godrej 272L 2 Star Frost Free Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Godrej%20272L%202%20Star%20Frost%20Free%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Samsung 653L Side By Side Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF7.webp"/></div>
<div class="dwo-product-body">
<h3>Samsung 653L Side By Side Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Samsung%20653L%20Side%20By%20Side%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Lloyd 562L Side By Side Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF8.webp"/></div>
<div class="dwo-product-body">
<h3>Lloyd 562L Side By Side Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Lloyd%20562L%20Side%20By%20Side%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Whirlpool 654L Side By Side Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF9.webp"/>
</div>
<div class="dwo-product-body">
<h3>Whirlpool 654L Side By Side Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Whirlpool%20654L%20Side%20By%20Side%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="Liebherr 428L 2 Star Frost Free Refrigerator" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/REF/REF10.webp"/></div>
<div class="dwo-product-body">
<h3>Liebherr 428L 2 Star Frost Free Refrigerator</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Liebherr%20428L%202%20Star%20Frost%20Free%20Refrigerator%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
</div>
</section>
<section class="dwo-content-section" data-category="washing-machines" hidden="" id="dwo-washing-machines">
<div class="dwo-section-heading">
<h2>Washing Machines</h2>
<p>Explore BEA Diwali Knockout Sale washing machine offers across top brands and capacities.</p>
</div>
<div class="dwo-product-grid">
<article class="dwo-product-card" data-deal-index="1">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="11.0 KG Top Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM1.webp"/></div>
<div class="dwo-product-body"><h3>11.0 KG Top Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2011.0%20KG%20Top%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="2">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="8.5 KG Top Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM2.webp"/></div>
<div class="dwo-product-body"><h3>8.5 KG Top Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%208.5%20KG%20Top%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="3">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="10.5 KG Top Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM3.webp"/></div>
<div class="dwo-product-body"><h3>10.5 KG Top Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2010.5%20KG%20Top%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="4">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="9.0/6.0 KG Washer Dryer" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM4.webp"/></div>
<div class="dwo-product-body"><h3>9.0/6.0 KG Washer Dryer</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%209.0/6.0%20KG%20Washer%20Dryer%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="5">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="8.0 KG Top Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM5.webp"/></div>
<div class="dwo-product-body"><h3>8.0 KG Top Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%208.0%20KG%20Top%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="6">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="9.0 KG Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM6.webp"/></div>
<div class="dwo-product-body"><h3>9.0 KG Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%209.0%20KG%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="7">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="9.0 KG Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM7.webp"/></div>
<div class="dwo-product-body"><h3>9.0 KG Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%209.0%20KG%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="8">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="8.0 KG Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM8.webp"/></div>
<div class="dwo-product-body"><h3>8.0 KG Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%208.0%20KG%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="9">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="9.0 KG Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM9.webp"/></div>
<div class="dwo-product-body"><h3>9.0 KG Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%209.0%20KG%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>




<article class="dwo-product-card" data-deal-index="11">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="12.0 KG Fully Automatic Front Load Washing Machine, Silver" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM11.webp"/></div>
<div class="dwo-product-body"><h3>12.0 KG Fully Automatic Front Load Washing Machine, Silver</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2012.0%20KG%20Fully%20Automatic%20Front%20Load%20Washing%20Machine%2C%20Silver%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="12">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="12.0 KG Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM12.webp"/></div>
<div class="dwo-product-body"><h3>12.0 KG Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2012.0%20KG%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="13">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="12 KG 5 Star Wi-Fi Fully Automatic Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM13.webp"/></div>
<div class="dwo-product-body"><h3>12 KG 5 Star Wi-Fi Fully Automatic Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2012%20KG%205%20Star%20Wi-Fi%20Fully%20Automatic%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
<article class="dwo-product-card" data-deal-index="14">
<div class="dwo-product-image-wrap"><span class="tag">Knockout Deal</span><img alt="12 KG 5 Star Wi-Fi Fully Automatic Front Load Washing Machine" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM14.webp"/></div>
<div class="dwo-product-body"><h3>12 KG 5 Star Wi-Fi Fully Automatic Front Load Washing Machine</h3><a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2012%20KG%205%20Star%20Wi-Fi%20Fully%20Automatic%20Front%20Load%20Washing%20Machine%20offer" rel="noopener" target="_blank">Get This Offer</a></div>
</article>
</div>
</section>
<section class="dwo-content-section" data-category="dishwashers" hidden="" id="dwo-dishwashers">
<div class="dwo-section-heading">
<h2>Dishwashers</h2>
<p>Explore the LG and Bosch dishwasher deals featured in the BEA Diwali Knockout Sale.</p>
</div>
<div class="dwo-product-grid">
<article class="dwo-product-card" data-per-day="100">
<div class="dwo-product-image-wrap"><span class="tag">Dishwasher Deal</span><img alt="14 Plate Setting Dish Washer" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM10.webp"/></div>
<div class="dwo-product-body">
<h3>14 Plate Setting Dish Washer</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2014%20Plate%20Setting%20Dish%20Washer%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="100">
<div class="dwo-product-image-wrap"><span class="tag">Dishwasher Deal</span><img alt="Silver Inox Bosch Dish Washer 15 Place Setting" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM15.webp"/></div>
<div class="dwo-product-body">
<h3>Silver Inox Bosch Dish Washer 15 Place Setting</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Silver%20Inox%20Bosch%20Dish%20Washer%2015%20Place%20Setting%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="100">
<div class="dwo-product-image-wrap"><span class="tag">Dishwasher Deal</span><img alt="14 Plate Setting Dish Washer" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/WM/WM16.webp"/></div>
<div class="dwo-product-body">
<h3>14 Plate Setting Dish Washer</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%2014%20Plate%20Setting%20Dish%20Washer%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
</div>
</section>
<section class="dwo-content-section" data-category="ac" hidden="" id="dwo-ac">
<div class="dwo-section-heading">
<h2>Air Conditioners</h2>
<p>Explore 10 AC knockout deals including two additional inverter AC offers.</p>
</div>
<div class="dwo-product-grid">
<article class="dwo-product-card" data-per-day="64">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="LG 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC1.webp"/>
</div>
<div class="dwo-product-body">
<h3>LG 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20LG%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="67">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Blue Star 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC2.webp"/>
</div>
<div class="dwo-product-body">
<h3>Blue Star 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Blue%20Star%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="67">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Godrej 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC3.webp"/>
</div>
<div class="dwo-product-body">
<h3>Godrej 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Godrej%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="80">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Voltas 2 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC4.webp"/>
</div>
<div class="dwo-product-body">
<h3>Voltas 2 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Voltas%202%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="96">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="IFB 1 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC5.webp"/>
</div>
<div class="dwo-product-body">
<h3>IFB 1 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20IFB%201%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="108">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Whirlpool 1.5 Ton Inverter 5 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC6.webp"/>
</div>
<div class="dwo-product-body">
<h3>Whirlpool 1.5 Ton Inverter 5 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Whirlpool%201.5%20Ton%20Inverter%205%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="111">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Daikin 0.8 Ton Non-Inverter 2 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC7.webp"/>
</div>
<div class="dwo-product-body">
<h3>Daikin 0.8 Ton Non-Inverter 2 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Daikin%200.8%20Ton%20Non-Inverter%202%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="131">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Hitachi 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC8.webp"/>
</div>
<div class="dwo-product-body">
<h3>Hitachi 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Hitachi%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="64">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="Lloyd 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC9.webp"/>
</div>
<div class="dwo-product-body">
<h3>Lloyd 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20Lloyd%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
<article class="dwo-product-card" data-per-day="64">
<div class="dwo-product-image-wrap">
<span class="tag">Knockout Deal</span>
<img alt="General 1.5 Ton Inverter 3 Star Air Conditioner" decoding="async" loading="lazy" src="/uploads/diwaliCamImages/AC/AC10.webp"/>
</div>
<div class="dwo-product-body">
<h3>General 1.5 Ton Inverter 3 Star Air Conditioner</h3>
<a class="dwo-whatsapp-btn" href="https://wa.me/919047995500?text=I%20would%20like%20to%20know%20about%20General%201.5%20Ton%20Inverter%203%20Star%20Air%20Conditioner%20offer" rel="noopener" target="_blank">Get This Offer</a>
</div>
</article>
</div>
</section>
<section aria-labelledby="dwo-leadFormTitle" class="dwo-lead-section" id="dwo-enquiry">
<div class="dwo-lead-card">
<div class="dwo-lead-heading">
<h2 id="dwo-leadFormTitle">Diwali Knockout Sale-ஐ Miss பண்ணாதீங்க!</h2>
<p>Drop your details below and our team will connect with you for the latest Diwali offers.</p>
</div>
<form class="dwo-lead-form" id="dwo-enquiryform">
<div class="dwo-form-group">
<label for="dwo-enquiryName">Name</label>
<input autocomplete="name" id="dwo-enquiryName" placeholder="Enter your name" required="" type="text"/>
</div>
<div class="dwo-form-group">
<label for="dwo-enquiryPhone">Phone Number</label>
<input autocomplete="tel" id="dwo-enquiryPhone" placeholder="+91 XXXXX XXXXX" required="" type="tel"/>
</div>
<div class="dwo-form-group">
<label for="dwo-enquiryEmail">Email Address</label>
<input autocomplete="email" id="dwo-enquiryEmail" placeholder="Enter your email" type="email"/>
</div>
<div class="dwo-form-group">
<label for="dwo-enquiryCity">Area / City</label>
<input autocomplete="address-level2" id="dwo-enquiryCity" placeholder="E.g., Gandhipuram, Coimbatore" required="" type="text"/>
</div>
<div class="dwo-form-group full">
<label for="dwo-category">Product You Are Looking For</label>
<select id="dwo-category" multiple="">
<option value="Smart TV">Smart TV</option>
<option value="Refrigerator">Refrigerator</option>
<option value="Washing Machine">Washing Machine</option>
<option value="Air Conditioner">Air Conditioner</option>
<option value="Phones">Mobiles &amp; Smartphones</option>
<option value="Laptops">Laptops</option>
<option value="Kitchen Appliances">Kitchen Appliances</option>
<option value="Home Appliances">Home Appliances</option>
<option value="Gadgets">Gadgets</option>
</select>
</div>
<div class="dwo-form-group full">
<label for="dwo-enquiryMessage">Message (Optional)</label>
<textarea id="dwo-enquiryMessage" placeholder="Enter your message or requirements (optional)" rows="4"></textarea>
</div>
<div class="dwo-form-group full">
<p aria-live="polite" class="dwo-enquiry-status" id="dwo-enquiryStatus"></p>
<p aria-live="polite" class="dwo-enquiry-success dwo-is-hidden" hidden="" id="dwo-enquirySuccessMessage" role="status">Thank you!
              Your enquiry has been submitted.</p>
</div>
<div class="dwo-lead-submit-row">
<button class="dwo-lead-submit" id="dwo-enquirySubmitBtn" type="submit">Submit Enquiry</button>
</div>
</form>
</div>
</section>
<section class="dwo-faq-section" id="dwo-faq">
<div class="dwo-faq-inner">
<div class="dwo-faq-copy">
<h2>Frequently Asked Questions</h2>
<p>Everything you need to know about the BEA Diwali Knockout Sale.</p>
</div>
<div class="dwo-faq-list">
<details class="dwo-faq-item">
<summary>What products are included in the BEA Diwali Knockout Sale?</summary>
<div class="dwo-faq-answer">
<p>Offers are available across selected TVs, refrigerators, washing machines, dishwashers and other home
                appliances.</p>
</div>
</details>
<details class="dwo-faq-item">
<summary>Are the Diwali Knockout Sale offers available in all BEA showrooms?</summary>
<div class="dwo-faq-answer">
<p>Offers may vary by showroom, product availability and location. Please contact your nearest BEA
                showroom for the latest offer details.</p>
</div>
</details>
<details class="dwo-faq-item">
<summary>Can I buy products on EMI during the sale?</summary>
<div class="dwo-faq-answer">
<p>Yes. Easy EMI options are available on eligible products, subject to bank and finance partner terms and
                conditions.</p>
</div>
</details>
<details class="dwo-faq-item">
<summary>Are exchange offers available during the sale?</summary>
<div class="dwo-faq-answer">
<p>Exchange benefits may be available on selected products and categories, depending on the product
                condition and applicable offer.</p>
</div>
</details>
<details class="dwo-faq-item">
<summary>How can I enquire about a product or Diwali Knockout Sale offer?</summary>
<div class="dwo-faq-answer">
<p>Use the Get This Offer button on the relevant product card to connect with BEA on WhatsApp and check
                pricing, availability and current offers.</p>
</div>
</details>
</div>
</div>
</section>
<section class="dwo-visit-section">
<div class="dwo-visit-card">
<h2>இந்த தீபாவளிக்கு, BEA-வின் Knockout Sale Offers உங்களுக்காகக் காத்திருக்கின்றன! 🪔🎉</h2>
<p>Visit your nearest BEA showroom to experience live models and check the latest Diwali Knockout Sale offers
          and availability.</p>
<div class="dwo-action-row">
<a href="https://www.bharathelectronics.in/" rel="noopener" target="_blank">Shop Online</a>
<a href="https://www.bharathelectronics.in/location" rel="noopener" target="_blank">Find Showroom</a>
<a href="https://www.bharathelectronics.in/contact" rel="noopener" target="_blank">Contact Support</a>
</div>
</div>
</section>
</main>
<div class="dwo-footer">
<div>© 2026 Bharath Electronics &amp; Appliances (BEA). All Rights Reserved.</div>
<div>Diwali Knockout Sale offers valid till stocks last. T&amp;C Apply.</div>
<div class="dwo-footer-links">
<a href="https://www.bharathelectronics.in/" rel="noopener" target="_blank">Main Website</a>
<a href="https://www.bharathelectronics.in/location" rel="noopener" target="_blank">Showrooms</a>
<a href="https://www.bharathelectronics.in/contact" rel="noopener" target="_blank">Contact Us</a>
</div>
<div>Page By <a href="https://vleafy.com" rel="noopener" target="_blank">Vleafy</a></div>
</div>
`;

export default function DiwaliKnockoutSale() {
  useEffect(() => {
    const styleId = "bea-diwali-knockout-sale-styles";
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      style.textContent = pageStyles;
      document.head.appendChild(style);
    }

    const root = document.getElementById("bea-diwali-knockout-sale");
    if (!root) return;

    // Category tabs: same behavior as the original page.
    const bar = root.querySelector("#dwo-deal-category-bar");
    const buttons = [...(bar?.querySelectorAll(".dwo-category-tab[data-category]") || [])];
    const sections = [...root.querySelectorAll(".dwo-content-section[data-category]")];
    const selectCategory = (category) => {
      if (!category) return;
      const currentRoot = document.getElementById("bea-diwali-knockout-sale") || document;
      const allButtons = currentRoot.querySelectorAll(".dwo-category-tab[data-category]");
      allButtons.forEach((btn) => {
        const active = btn.dataset.category === category;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
        btn.tabIndex = active ? 0 : -1;
      });
      const allSections = currentRoot.querySelectorAll(".dwo-content-section[data-category]");
      allSections.forEach((section) => {
        const active = section.dataset.category === category;
        if (active) {
          section.removeAttribute("hidden");
          section.hidden = false;
          section.style.display = "block";
          section.classList.add("is-active");
        } else {
          section.setAttribute("hidden", "");
          section.hidden = true;
          section.style.display = "none";
          section.classList.remove("is-active");
        }
      });
    };
    const onCategoryClick = (event) => {
      const button = event.target.closest(".dwo-category-tab[data-category]");
      if (button && button.dataset.category) {
        event.preventDefault();
        selectCategory(button.dataset.category);
      }
    };
    const onCategoryKey = (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : event.key === "ArrowRight" ? (index + 1) % buttons.length : (index + buttons.length - 1) % buttons.length;
      selectCategory(buttons[next].dataset.category);
      buttons[next].focus();
    };
    document.addEventListener("click", onCategoryClick);
    bar?.addEventListener("click", onCategoryClick);
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        selectCategory(btn.dataset.category);
      });
    });
    bar?.addEventListener("keydown", onCategoryKey);
    selectCategory("tvs");

    // Mobile navigation.
    const menuButton = root.querySelector("#dwo-mobileMenuToggle");
    const menu = root.querySelector("#dwo-mobileMenu");
    const closeMenu = () => { menu?.classList.remove("is-open"); menuButton?.setAttribute("aria-expanded", "false"); };
    const toggleMenu = () => {
      const isOpen = menu?.classList.toggle("is-open");
      menuButton?.setAttribute("aria-expanded", String(Boolean(isOpen)));
    };
    menuButton?.addEventListener("click", toggleMenu);
    menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    const onEscape = (event) => { if (event.key === "Escape") closeMenu(); };
    const onResize = () => { if (window.innerWidth > 768) closeMenu(); };
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onResize);

    // Multi-select enhancement, if Tom Select is available on the page.
    let tomSelect = null;
    const categorySelect = root.querySelector("#dwo-category");
    if (categorySelect && window.TomSelect && !categorySelect.tomselect) {
      tomSelect = new window.TomSelect(categorySelect, { plugins: ["remove_button"], placeholder: "Select categories...", maxItems: null });
    }

    // Enquiry form retains the existing Google Apps Script endpoint and dataLayer event.
    const form = root.querySelector("#dwo-enquiryform");
    const onSubmit = async (event) => {
      event.preventDefault();
      const name = root.querySelector("#dwo-enquiryName")?.value.trim() || "";
      const phone = root.querySelector("#dwo-enquiryPhone")?.value.trim() || "";
      const email = root.querySelector("#dwo-enquiryEmail")?.value.trim() || "";
      const city = root.querySelector("#dwo-enquiryCity")?.value.trim() || "";
      const message = root.querySelector("#dwo-enquiryMessage")?.value.trim() || "";
      const categories = Array.from(categorySelect?.selectedOptions || []).map((option) => option.value).join(", ");
      if (!name || !phone || !city) return;
      const submitButton = root.querySelector("#dwo-enquirySubmitBtn");
      const status = root.querySelector("#dwo-enquiryStatus");
    
      const success = root.querySelector("#dwo-enquirySuccessMessage");
      if (success) { success.classList.add("dwo-is-hidden"); success.hidden = true; }
      if (status) { status.className = "dwo-enquiry-status"; status.textContent = "Submitting your enquiry..."; }
      if (submitButton) submitButton.disabled = true;
      const userMessageContent = message.trim();
      const finalMessage = userMessageContent ? `from diwali-offer: ${userMessageContent}` : (categories ? `from diwali-offer: Interested in ${categories}` : "from diwali-offer: lead from diwali-offer");
      const now = new Date();
      const enquiryDate = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
      const enquiryTime = now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata" });
      const params = new URLSearchParams({
        sheetName: "Diwali 2026", Name: name, Phone: phone, City: city,
        Interested: categories, Message: finalMessage, Email: email, Date: `${enquiryDate} ${enquiryTime}`
      });
      const endpoint = "https://script.google.com/macros/s/AKfycbxiuTT8dQhuaqL1WURYHrMtCQqUummxiiA63W6iEB9mz23jze7GZvvfrNiiUczhJWfAMg/exec?" + params;
      try {
        const response = await fetch("/api/contact/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            email_address: email || "diwalioffers@bharathelectronics.in",
            mobile_number: phone,
            city: city,
            category: categories,
            message: finalMessage,
            status: "active",
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to submit enquiry");
        }
        fetch(endpoint, { method: "GET", mode: "no-cors" }).catch(() => {});
        if (status) status.textContent = "";
        if (success) { success.classList.remove("dwo-is-hidden"); success.classList.remove("dwo-dwo-is-hidden"); success.hidden = false; }
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event: "enquiry_form_success" });
        form?.reset();
        if (categorySelect?.tomselect) categorySelect.tomselect.clear();
      } catch (error) {
        console.error("Submission failed:", error);
        if (success) { success.classList.add("dwo-is-hidden"); success.hidden = true; }
        if (status) { status.className = "dwo-enquiry-status dwo-enquiry-error"; status.textContent = error.message || "Submission failed. Please try again."; }
      } finally { if (submitButton) submitButton.disabled = false; }
    };
    form?.addEventListener("submit", onSubmit);

    return () => {
      document.removeEventListener("click", onCategoryClick);
      bar?.removeEventListener("click", onCategoryClick);
      bar?.removeEventListener("keydown", onCategoryKey);
      menuButton?.removeEventListener("click", toggleMenu);
      menu?.querySelectorAll("a").forEach((link) => link.removeEventListener("click", closeMenu));
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onResize);
      form?.removeEventListener("submit", onSubmit);
      if (tomSelect) tomSelect.destroy();
    };
  }, []);

  return (
    <div id="bea-diwali-knockout-sale" className="min-h-screen w-full overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: pageStyles }} />
      <div dangerouslySetInnerHTML={{ __html: pageMarkup }} />
    </div>
  );
}
