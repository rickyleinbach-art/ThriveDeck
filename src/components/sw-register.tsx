"use client";

import { useEffect } from "react";

// Registers the service worker once on the client, enabling install prompts
// (manifest + fetch-handling SW) and static-asset caching.
export function SwRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works online.
      });
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
