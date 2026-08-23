"use client";

import { useEffect } from "react";

/** Tawk.to embed — Administration → Chat Widget gives you these two ids. */
const TAWK_PROPERTY_ID = "635870c8daff0e1306d3fa39";
const TAWK_WIDGET_ID = "1gg8nh4rc";
const SCRIPT_ID = "tawk-to-script";

declare global {
  interface Window {
    Tawk_API?: Record<string, unknown>;
    Tawk_LoadStart?: Date;
  }
}

/**
 * Official Tawk loader (not next/script): the widget expects `Tawk_API` and
 * `crossorigin="*"` before it boots, otherwise the launcher never appears.
 */
export function TawkChat() {
  useEffect(() => {
    if (document.getElementById(SCRIPT_ID)) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);
  }, []);

  return null;
}
