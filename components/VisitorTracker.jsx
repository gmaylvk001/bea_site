"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    const logVisit = () => {
      fetch("/api/visitorlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page: window.location.pathname,
          referer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(logVisit, { timeout: 5000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(logVisit, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
