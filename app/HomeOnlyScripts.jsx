"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeOnlyScripts() {
  const pathname = usePathname();

  useEffect(() => {
    let typebotCancelled = false;
    let typebotTimer;

    // -------------------------
    // SPA-safe cleanup (admin only for Typebot)
    // -------------------------
    const hideTawk = () => {
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    const hideTypebot = () => {
      document
        .querySelectorAll(
          "typebot-bubble, typebot-standard, typebot-container, [id^='typebot'], [class*='typebot']"
        )
        .forEach((el) => el.remove());
      document.getElementById("typebot-zindex-fix")?.remove();
      window.__Typebot = null;
    };

    // -------------------------
    // Load Typebot (keep — do not remove on normal navigation)
    // -------------------------
    const loadTypebot = async () => {
      try {
        if (window.__Typebot || document.querySelector("typebot-bubble")) {
          return;
        }

        const { default: Typebot } = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3.12/dist/web.js"
        );

        if (!typebotCancelled && !pathname?.startsWith("/admin")) {
          Typebot.initBubble({
            typebot: "bea-chatbot",
            apiHost: "https://chat.infozub.com",
            previewMessage: {
              message: "Chat Now!",
              avatarUrl:
                "https://infozub.com/wp-content/uploads/2024/02/BEA_logo.png",
            },
            theme: {
              button: { backgroundColor: "#0042DA" },
              chatWindow: { backgroundColor: "#ffffff" },
            },
          });
          window.__Typebot = Typebot;

          if (!document.getElementById("typebot-zindex-fix")) {
            const style = document.createElement("style");
            style.id = "typebot-zindex-fix";
            style.textContent = `typebot-bubble { z-index: 100000 !important; }`;
            document.head.appendChild(style);
          }
        }
      } catch (e) {
        console.error("Typebot failed to load", e);
      }
    };

    // -------------------------
    // SPA-safe Tawk.to show/hide
    // -------------------------
    const showTawk = () => {
      if (window.Tawk_API && typeof window.Tawk_API.showWidget === "function") {
        window.Tawk_API.showWidget();
      }
    };

    const loadTawk = () => {
      if (!document.getElementById("tawk-script")) {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        window.Tawk_API.onLoad = function () {
          if (
            !window.location.pathname?.startsWith("/admin") &&
            typeof window.Tawk_API.showWidget === "function"
          ) {
            window.Tawk_API.showWidget();
          }
        };

        const tawkScript = document.createElement("script");
        tawkScript.id = "tawk-script";
        tawkScript.async = true;
        // Real property ID from GTM-KVT2Z9RR (was YOUR_TAWK_ID placeholder)
        tawkScript.src =
          "https://embed.tawk.to/5affad0f5f7cdf4f05345a87/default";
        tawkScript.charset = "UTF-8";
        tawkScript.setAttribute("crossorigin", "*");
        document.head.appendChild(tawkScript);
      } else {
        showTawk();
      }
    };

    // -------------------------
    // Main SPA logic
    // -------------------------
    if (pathname?.startsWith("/admin")) {
      hideTypebot();
      hideTawk();
    } else {
      loadTypebot();
      loadTawk();
    }

    return () => {
      typebotCancelled = true;
      clearTimeout(typebotTimer);
      // Do not remove Typebot / WhatsApp — only hide Tawk when leaving non-admin cleanup is not needed
      // Typebot stays; WhatsApp is separate in layout (WhatsAppFloat)
    };
  }, [pathname]);

  return null;
}
