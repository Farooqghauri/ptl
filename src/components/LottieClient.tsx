// components/LottieClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";

type Props = {
  animationUrl: string; // e.g. "/lottie/ai-legal-drafting.json"
  className?: string;
  ariaLabel?: string;
};

export default function LottieClient({ animationUrl, className, ariaLabel = "Decorative animation" }: Props) {
  const [animationData, setAnimationData] = useState<unknown | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(animationUrl);
        if (!res.ok) {
          // don't throw — keep blank if missing
          console.warn(`Lottie JSON not found: ${animationUrl}`);
          return;
        }
        const json = await res.json();
        if (mounted) setAnimationData(json);
      } catch (err) {
        // network or parse error
        // deliberately not throwing to avoid crashes in production
        console.error("Failed to load Lottie animation", err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [animationUrl]);

  return (
    <div className={`rounded-5xl overflow-hidden shadow-xl bg-white ${className ?? ""}`} aria-hidden={!!ariaLabel ? "false" : "true"}>
      {animationData ? (
        <div style={{ width: "100%", height: "100%", minHeight: 240 }}>
          <Lottie animationData={animationData} loop style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      ) : (
        // graceful fallback (small placeholder)
        <div className="flex items-center justify-center p-8 min-h-[240px]">
          <div className="text-sm text-gray-500">Animation loading…</div>
        </div>
      )}
    </div>
  );
}
