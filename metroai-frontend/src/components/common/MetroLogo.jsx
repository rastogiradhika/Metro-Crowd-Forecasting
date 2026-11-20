import React from 'react';

/**
 * Original MetroAI Brand Symbol
 * Minimal geometric train silhouette combined with transit intelligence / AI data nodes.
 * Vector SVG sharp at any scale. Fully reactive to dark/light themes.
 */
export default function MetroLogo({ className = "w-8 h-8", size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer rounded transit chassis container */}
      <rect
        x="2.5"
        y="2.5"
        width="27"
        height="27"
        rx="7"
        className="fill-[#0B100E] dark:fill-[#0B100E] stroke-[#26332E] dark:stroke-[#26332E]"
        strokeWidth="1.5"
      />

      {/* Sleek Train Front Cab Profile */}
      <path
        d="M9 10C9 8.34315 10.3431 7 12 7H20C21.6569 7 23 8.34315 23 10V19C23 20.6569 21.6569 22 20 22H12C10.3431 22 9 20.6569 9 19V10Z"
        className="stroke-[#059669]"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Train Panoramic Windshield Glass */}
      <rect
        x="11.5"
        y="9.5"
        width="9"
        height="5"
        rx="1.5"
        className="fill-[#059669]/20 stroke-[#059669]"
        strokeWidth="1.2"
      />

      {/* AI / Transit Telemetry Signal Nodes (Dual Headlights + Center Pulse) */}
      <circle cx="12.5" cy="18.5" r="1.25" className="fill-[#35D9A5]" />
      <circle cx="19.5" cy="18.5" r="1.25" className="fill-[#35D9A5]" />
      <circle cx="16" cy="18.5" r="0.75" className="fill-[#F5F7F6]" />

      {/* Transit Guideway Rails underneath */}
      <path
        d="M11 25L8 27M21 25L24 27M13 25H19"
        className="stroke-[#9AA8A1]"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
