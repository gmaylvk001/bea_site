"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeOnlyScripts() {
  const pathname = usePathname();

  useEffect(() => {
    let typebotCancelled = false;
    let typebotTimer;

    const cleanupDOM = () => {
      document
        .querySelectorAll(
          "typebot-bubble, typebot-standard, typebot-container, [id^='typebot'], [class*='typebot']"
        )
        .forEach((el) => el.remove());
      document.getElementById("typebot-zindex-fix")?.remove();
      window.__Typebot = null;

      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    const loadTypebot = async () => {
      try {
        const { default: Typebot } = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3.12/dist/web.js"
        );

        if (!typebotCancelled && !pathname?.startsWith("/admin")) {
          Typebot.initBubble({
            typebot: "bea-chatbot",
            apiHost: "https://chat.infozub.com",
            previewMessage: {
              message: "Chat Now!",
              avatarUrl: "https://infozub.com/wp-content/uploads/2024/02/BEA_logo.png",
            },
            theme: {
              button: { backgroundColor: "#0042DA" },
              chatWindow: { backgroundColor: "#ffffff" },
            },
          });
          window.__Typebot = Typebot;
          const style = document.createElement("style");
          style.id = "typebot-zindex-fix";
          style.textContent = `typebot-bubble { z-index: 100000 !important; }`;
          document.head.appendChild(style);
        }
      } catch (e) {
        console.error("Typebot failed to load", e);
      }
    };

    const showTawk = () => {
      if (window.Tawk_API && typeof window.Tawk_API.showWidget === "function") {
        window.Tawk_API.showWidget();
      }
    };

    const loadTawk = () => {
      if (!window.Tawk_API) {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        const tawkScript = document.createElement("script");
        tawkScript.async = true;
        tawkScript.src = "https://embed.tawk.to/YOUR_TAWK_ID/default";
        tawkScript.charset = "UTF-8";
        tawkScript.setAttribute("crossorigin", "*");
        document.head.appendChild(tawkScript);
      }
      showTawk();
    };

    const deferThirdParty = (fn) => {
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(fn, { timeout: 4000 });
      } else {
        setTimeout(fn, 3000);
      }
    };

    if (pathname?.startsWith("/admin")) {
      cleanupDOM();
    } else {
      typebotTimer = setTimeout(() => {
        deferThirdParty(() => {
          if (!typebotCancelled) loadTypebot();
        });
      }, 2000);
      deferThirdParty(loadTawk);
    }

    return () => {
      typebotCancelled = true;
      clearTimeout(typebotTimer);
      cleanupDOM();
    };
  }, [pathname]);

  return null;
}
