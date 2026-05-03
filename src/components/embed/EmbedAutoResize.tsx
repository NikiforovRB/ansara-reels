"use client";

import { useEffect } from "react";

/**
 * Posts the current document height to the parent window, so the
 * embedding site (iframe parent) can resize the iframe to fit
 * 100% of the content (no clipped reels).
 */
export function EmbedAutoResize() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.parent === window) return; // not iframed

    const send = () => {
      const h = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight ?? 0,
      );
      window.parent.postMessage({ type: "ar:height", height: h }, "*");
    };

    send();
    const ro = new ResizeObserver(() => send());
    ro.observe(document.documentElement);
    if (document.body) ro.observe(document.body);

    const onLoad = () => send();
    window.addEventListener("load", onLoad);
    const interval = window.setInterval(send, 1000);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", onLoad);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
