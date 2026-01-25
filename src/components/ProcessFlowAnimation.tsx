"use client";

import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  height?: number;
};

export default function ProcessFlowAnimation({
  title = "How PTL Works",
  subtitle = "Upload → Extract → Summarize → Display → Download",
  height = 220,
}: Props) {
  return (
    <section className="w-full">
      <div className="mb-4 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
        <p className="text-sm sm:text-base text-gray-400">{subtitle}</p>
      </div>

      <div className="w-full overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/30 backdrop-blur">
        <div className="p-4 sm:p-6">
          <svg
            viewBox="0 0 1100 220"
            width="100%"
            height={height}
            role="img"
            aria-label="PTL process animation"
          >
            <defs>
              <linearGradient id="ptlGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="35%" stopColor="#06B6D4" />
                <stop offset="70%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>

              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <style>{`
                .ptl-line {
                  stroke: url(#ptlGrad);
                  stroke-width: 6;
                  fill: none;
                  stroke-linecap: round;
                  stroke-dasharray: 14 10;
                  animation: dash 1.2s linear infinite;
                  opacity: 0.9;
                }

                .ptl-dot {
                  filter: url(#softGlow);
                  animation: moveDot 3.2s ease-in-out infinite;
                }

                .ptl-dot2 {
                  filter: url(#softGlow);
                  animation: moveDot 3.2s ease-in-out infinite;
                  animation-delay: 0.35s;
                  opacity: 0.85;
                }

                .ptl-node {
                  filter: url(#softGlow);
                  animation: pulse 2.4s ease-in-out infinite;
                }

                .ptl-node:nth-of-type(2) { animation-delay: 0.15s; }
                .ptl-node:nth-of-type(3) { animation-delay: 0.30s; }
                .ptl-node:nth-of-type(4) { animation-delay: 0.45s; }
                .ptl-node:nth-of-type(5) { animation-delay: 0.60s; }

                .ptl-label {
                  font: 600 14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
                  fill: rgba(226, 232, 240, 0.92);
                }

                .ptl-sub {
                  font: 500 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto;
                  fill: rgba(226, 232, 240, 0.70);
                }

                @keyframes dash {
                  to { stroke-dashoffset: -24; }
                }

                @keyframes moveDot {
                  0% { transform: translate(0px, 0px); opacity: 0.0; }
                  8% { opacity: 1.0; }
                  20% { transform: translate(200px, 0px); }
                  40% { transform: translate(420px, 0px); }
                  60% { transform: translate(640px, 0px); }
                  80% { transform: translate(860px, 0px); }
                  92% { opacity: 1.0; }
                  100% { transform: translate(1040px, 0px); opacity: 0.0; }
                }

                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 0.92; }
                  50% { transform: scale(1.06); opacity: 1; }
                }
              `}</style>
            </defs>

            <rect x="0" y="0" width="1100" height="220" rx="18" fill="rgba(17, 24, 39, 0.4)" />
            <path className="ptl-line" d="M60 110 H1040" />

            <g>
              <circle className="ptl-node" cx="60" cy="110" r="20" fill="#7C3AED" opacity="0.95" />
              <circle className="ptl-node" cx="260" cy="110" r="20" fill="#06B6D4" opacity="0.95" />
              <circle className="ptl-node" cx="480" cy="110" r="20" fill="#F97316" opacity="0.95" />
              <circle className="ptl-node" cx="700" cy="110" r="20" fill="#22C55E" opacity="0.95" />
              <circle className="ptl-node" cx="920" cy="110" r="20" fill="#3B82F6" opacity="0.95" />
            </g>

            <g className="ptl-dot">
              <circle cx="60" cy="110" r="10" fill="url(#ptlGrad)" />
            </g>
            <g className="ptl-dot2">
              <circle cx="60" cy="110" r="7" fill="url(#ptlGrad)" />
            </g>

            <g>
              <text className="ptl-label" x="60" y="70" textAnchor="middle">User</text>
              <text className="ptl-sub" x="60" y="92" textAnchor="middle">Upload File</text>

              <text className="ptl-label" x="260" y="70" textAnchor="middle">Backend</text>
              <text className="ptl-sub" x="260" y="92" textAnchor="middle">Extract Text</text>

              <text className="ptl-label" x="480" y="70" textAnchor="middle">AI Layer</text>
              <text className="ptl-sub" x="480" y="92" textAnchor="middle">Summarize</text>

              <text className="ptl-label" x="700" y="70" textAnchor="middle">Frontend</text>
              <text className="ptl-sub" x="700" y="92" textAnchor="middle">Display</text>

              <text className="ptl-label" x="920" y="70" textAnchor="middle">User</text>
              <text className="ptl-sub" x="920" y="92" textAnchor="middle">Download</text>
            </g>

            <text className="ptl-sub" x="550" y="195" textAnchor="middle">
              Secure Flow: File → Text → Validated JSON → UI → Export
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}