"use client"

// Kash mascot components — faithful ports of the design system's primitives.jsx
// Both consume CSS variables so they re-skin by direction.

import { useState } from "react"

interface PiggyMarkProps {
  size?: number
  className?: string
}

// Tiny side-profile piggy glyph for nav/badges (40×32 viewBox)
export function PiggyMark({ size = 24, className }: PiggyMarkProps) {
  return (
    <svg
      viewBox="0 0 40 32"
      width={size}
      height={(size * 32) / 40}
      aria-hidden
      className={className}
    >
      {/* legs behind body */}
      <rect x="11" y="22" width="4" height="5" rx="1" fill="var(--pig-deep)" />
      <rect x="25" y="22" width="4" height="5" rx="1" fill="var(--pig-deep)" />
      {/* body */}
      <path
        d="M 10 22 C 10 14, 16 10, 22 10 C 30 10, 34 14, 34 19 C 34 23, 31 25, 27 25 L 14 25 C 12 25, 10 24, 10 22 Z"
        fill="var(--pig)"
      />
      {/* snout */}
      <ellipse cx="11" cy="20" rx="3.5" ry="2.8" fill="var(--pig-deep)" />
      <circle cx="10" cy="19.2" r="0.6" fill="var(--pig-shadow)" />
      <circle cx="10" cy="20.8" r="0.6" fill="var(--pig-shadow)" />
      {/* eye */}
      <circle cx="17" cy="16" r="0.9" fill="var(--pig-shadow)" />
      {/* ear */}
      <path d="M 22 11 L 26 10 L 24 14 Z" fill="var(--pig-deep)" />
      {/* coin slot */}
      <rect x="24" y="11" width="7" height="1.6" rx="0.8" fill="var(--pig-shadow)" />
    </svg>
  )
}

interface PiggyProps {
  size?: number
  mood?: "happy" | "neutral" | "sleep"
  fill?: number
  coin?: boolean
  className?: string
}

let piggyIdCounter = 0

// Full side-profile piggy with fill window (240×200 viewBox)
export function Piggy({ size = 160, mood = "happy", fill = 0.5, coin = false, className }: PiggyProps) {
  const [id] = useState(() => `pigWin-${piggyIdCounter++}`)
  const W = 240, H = 200
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={size}
      height={(size * H) / W}
      aria-hidden
      className={className}
    >
      {/* ground shadow */}
      <ellipse cx="120" cy="186" rx="82" ry="6" fill="var(--pig-shadow)" opacity="0.18" />

      {/* back legs */}
      <rect x="66" y="140" width="22" height="36" rx="6" fill="var(--pig-deep)" />
      <rect x="154" y="140" width="22" height="36" rx="6" fill="var(--pig-deep)" />
      {/* front legs */}
      <rect x="82" y="140" width="22" height="38" rx="6" fill="var(--pig)" />
      <rect x="140" y="140" width="22" height="38" rx="6" fill="var(--pig)" />
      <rect x="82" y="172" width="22" height="6" fill="var(--pig-shadow)" opacity="0.25" />
      <rect x="140" y="172" width="22" height="6" fill="var(--pig-shadow)" opacity="0.25" />

      {/* body */}
      <path
        d="M 36 110 C 36 72, 78 50, 124 50 C 176 50, 214 76, 214 114 C 214 146, 186 160, 152 160 L 86 160 C 58 160, 36 146, 36 120 Z"
        fill="var(--pig)"
      />
      {/* belly highlight */}
      <path
        d="M 48 122 C 60 150, 160 156, 188 130 C 170 156, 68 160, 48 122 Z"
        fill="var(--pig-shadow)"
        opacity="0.10"
      />

      {/* snout */}
      <ellipse cx="40" cy="112" rx="22" ry="18" fill="var(--pig)" />
      <ellipse cx="34" cy="112" rx="12" ry="10" fill="var(--pig-deep)" opacity="0.55" />
      <circle cx="30" cy="108" r="2.2" fill="var(--pig-shadow)" />
      <circle cx="30" cy="116" r="2.2" fill="var(--pig-shadow)" />

      {/* eye */}
      {mood === "happy" ? (
        <path d="M 72 96 q 6 -6 12 0" stroke="var(--pig-shadow)" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : mood === "sleep" ? (
        <path d="M 70 96 h 16" stroke="var(--pig-shadow)" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : (
        <circle cx="78" cy="96" r="3" fill="var(--pig-shadow)" />
      )}
      {/* cheek */}
      <circle cx="66" cy="112" r="5" fill="var(--pig-deep)" opacity="0.35" />

      {/* ear */}
      <path d="M 98 56 L 118 52 L 108 78 Z" fill="var(--pig-deep)" />
      <path d="M 102 60 L 114 58 L 108 72 Z" fill="var(--pig-shadow)" opacity="0.4" />

      {/* coin slot */}
      <rect x="116" y="44" width="36" height="7" rx="3.5" fill="var(--pig-shadow)" />
      <rect x="116" y="44" width="36" height="2" rx="1" fill="var(--ink)" opacity="0.25" />

      {/* tail */}
      <path
        d="M 214 110 q 14 -2 14 -14 q 0 -10 -10 -10"
        stroke="var(--pig-deep)"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />

      {/* belly fill window */}
      <clipPath id={id}>
        <rect x="78" y="98" width="80" height="50" rx="24" />
      </clipPath>
      <rect x="78" y="98" width="80" height="50" rx="24" fill="var(--bg-sunk)" opacity="0.5" />
      <g clipPath={`url(#${id})`}>
        <rect x="78" y={148 - 50 * fill} width="80" height={50 * fill} fill="var(--gold)" />
        <circle cx="100" cy={146 - 50 * fill + 14} r="6" fill="var(--gold-soft)" opacity="0.9" />
        <circle cx="118" cy={146 - 50 * fill + 8} r="6" fill="var(--gold-soft)" opacity="0.9" />
        <circle cx="136" cy={146 - 50 * fill + 16} r="6" fill="var(--gold-soft)" opacity="0.9" />
      </g>
      <rect x="78" y="98" width="80" height="50" rx="24" fill="none" stroke="var(--pig-shadow)" strokeWidth="1.5" opacity="0.3" />

      {/* falling coin */}
      {coin && (
        <g>
          <circle cx="134" cy="28" r="8" fill="var(--gold)" stroke="var(--ink)" strokeWidth="1.5" />
          <text x="134" y="32" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--ink)">$</text>
        </g>
      )}
    </svg>
  )
}
