'use client';

import React from 'react';

interface MedicalBackgroundProps {
  children: React.ReactNode;
}

export default function MedicalBackground({ children }: MedicalBackgroundProps) {
  return (
    <>
      {/* Full page medical-themed background pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none">
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="medical-pattern"
              x="0"
              y="0"
              width="100"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              {/* Medical Cross */}
              <path
                d="M20,10 H30 V0 H40 V10 H50 V20 H40 V30 H30 V20 H20 V10 Z"
                fill="#0f172a"
              />
              
              {/* Stethoscope */}
              <path
                d="M70,20 C65,20 60,25 60,30 C60,35 65,40 70,40 C75,40 80,35 80,30 C80,25 75,20 70,20 Z M70,15 V5 H80 V15 M70,10 H60 C55,10 55,20 55,25 C55,30 55,40 65,40"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
              />
              
              {/* DNA Helix */}
              <path
                d="M10,60 C15,65 25,65 30,60 C35,55 35,45 30,40 C25,35 15,35 10,40 M30,60 C35,65 45,65 50,60 C55,55 55,45 50,40 C45,35 35,35 30,40 M10,40 C5,35 5,25 10,20 C15,15 25,15 30,20 C35,25 35,35 30,40 M30,40 C25,45 25,55 30,60 M10,40 C15,45 15,55 10,60"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              
              {/* Pill */}
              <ellipse
                cx="80"
                cy="70"
                rx="15"
                ry="8"
                transform="rotate(-45 80 70)"
                fill="#0f172a"
              />
              <ellipse
                cx="80"
                cy="70"
                rx="10"
                ry="5"
                transform="rotate(-45 80 70)"
                fill="white"
              />
              
              {/* Heartbeat Line */}
              <path
                d="M0,90 L10,90 L15,80 L20,100 L25,85 L30,90 L40,90"
                fill="none"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              
              {/* Medical Flask */}
              <path
                d="M60,80 H70 V85 C70,95 60,95 60,85 V80 Z"
                fill="#0f172a"
              />
              <line
                x1="60"
                y1="90"
                x2="70"
                y2="90"
                stroke="white"
                strokeWidth="1"
              />
              <line
                x1="63"
                y1="80"
                x2="63"
                y2="75"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
              <line
                x1="67"
                y1="80"
                x2="67"
                y2="75"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#medical-pattern)" />
        </svg>
      </div>
      
      {/* Content */}
      {children}
    </>
  );
}
