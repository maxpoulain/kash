"use client"

// Kash Logo - A playful yet professional piggy bank icon (side view)
// Designed for versatility across app icons, branding, and marketing materials

export interface KashLogoProps {
  className?: string
  variant?: "default" | "minimal" | "full" | "outline" | "monochrome"
  showText?: boolean
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
}

const sizeClasses = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
  "2xl": "w-32 h-32",
}

export function KashLogo({ 
  className = "", 
  variant = "default", 
  showText = false,
  size = "md" 
}: KashLogoProps) {
  const sizeClass = sizeClasses[size]
  
  if (showText) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LogoIcon variant={variant} className={sizeClass} />
        <span className="font-display font-bold text-foreground" style={{ fontSize: `calc(${size === "xs" ? "0.75rem" : size === "sm" ? "1rem" : size === "md" ? "1.25rem" : size === "lg" ? "1.5rem" : size === "xl" ? "2rem" : "2.5rem"})` }}>
          Kash
        </span>
      </div>
    )
  }
  
  return <LogoIcon variant={variant} className={`${sizeClass} ${className}`} />
}

function LogoIcon({ variant, className }: { variant: string; className: string }) {
  switch (variant) {
    case "minimal":
      return <KashLogoMinimal className={className} />
    case "full":
      return <KashLogoFull className={className} />
    case "outline":
      return <KashLogoOutline className={className} />
    case "monochrome":
      return <KashLogoMonochrome className={className} />
    default:
      return <KashLogoDefault className={className} />
  }
}

// Default Logo - Side view piggy bank with coin slot
function KashLogoDefault({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-label="Kash Logo">
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" className="fill-primary" />
      
      {/* Piggy body - side view, rounded rectangle shape */}
      <ellipse cx="30" cy="36" rx="18" ry="14" className="fill-primary-foreground/95" />
      
      {/* Back leg */}
      <rect x="14" y="44" width="6" height="8" rx="3" className="fill-primary-foreground/95" />
      
      {/* Front leg */}
      <rect x="34" y="44" width="6" height="8" rx="3" className="fill-primary-foreground/95" />
      
      {/* Ear - positioned on the back */}
      <ellipse cx="18" cy="26" rx="5" ry="7" className="fill-primary-foreground/95" transform="rotate(-20 18 26)" />
      <ellipse cx="18" cy="26" rx="3" ry="4" className="fill-primary/30" transform="rotate(-20 18 26)" />
      
      {/* Head/snout extending forward */}
      <ellipse cx="44" cy="36" rx="8" ry="10" className="fill-primary-foreground/95" />
      
      {/* Snout - side view nose */}
      <ellipse cx="50" cy="38" rx="5" ry="6" className="fill-primary/30" />
      <circle cx="51" cy="36" r="1.5" className="fill-primary/50" />
      <circle cx="51" cy="40" r="1.5" className="fill-primary/50" />
      
      {/* Eye - single eye visible from side */}
      <ellipse cx="42" cy="32" rx="4" ry="4.5" className="fill-card" />
      <circle cx="43" cy="31" r="2" className="fill-foreground/80" />
      <circle cx="44" cy="30" r="0.8" className="fill-card" />
      
      {/* Coin slot on top - signature element */}
      <rect x="24" y="20" width="12" height="4" rx="2" className="fill-coin" />
      <rect x="26" y="21.5" width="8" height="1" rx="0.5" className="fill-coin-foreground/40" />
      
      {/* Curly tail */}
      <path 
        d="M12 36 C8 36, 6 32, 8 28 C10 24, 14 26, 12 30" 
        className="stroke-primary-foreground/95 fill-none" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      
      {/* Cheek blush */}
      <ellipse cx="46" cy="40" rx="3" ry="2" className="fill-chart-5/40" />
      
      {/* Coin going in - adds dynamism */}
      <circle cx="30" cy="14" r="4" className="fill-coin" />
      <text x="30" y="16" textAnchor="middle" className="fill-coin-foreground/60" fontSize="5" fontWeight="bold">$</text>
    </svg>
  )
}

// Minimal Logo - Simplified side view for small sizes
function KashLogoMinimal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-label="Kash Logo">
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" className="fill-primary" />
      
      {/* Simplified piggy body */}
      <ellipse cx="30" cy="36" rx="16" ry="12" className="fill-primary-foreground/95" />
      
      {/* Legs - simplified */}
      <rect x="18" y="44" width="5" height="6" rx="2.5" className="fill-primary-foreground/95" />
      <rect x="34" y="44" width="5" height="6" rx="2.5" className="fill-primary-foreground/95" />
      
      {/* Ear */}
      <ellipse cx="20" cy="28" rx="4" ry="5" className="fill-primary-foreground/95" transform="rotate(-15 20 28)" />
      
      {/* Head */}
      <ellipse cx="42" cy="36" rx="7" ry="9" className="fill-primary-foreground/95" />
      
      {/* Snout */}
      <ellipse cx="48" cy="38" rx="4" ry="5" className="fill-primary/30" />
      <circle cx="49" cy="36" r="1" className="fill-primary/50" />
      <circle cx="49" cy="40" r="1" className="fill-primary/50" />
      
      {/* Eye */}
      <circle cx="41" cy="32" r="2.5" className="fill-foreground/70" />
      
      {/* Coin slot */}
      <rect x="25" y="22" width="10" height="3" rx="1.5" className="fill-coin" />
      
      {/* Tail - simplified */}
      <path d="M14 36 C10 36, 9 32, 11 30" className="stroke-primary-foreground/95 fill-none" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// Full Logo - Detailed side view for larger displays
function KashLogoFull({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-label="Kash Logo">
      <defs>
        <linearGradient id="kash-bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="[stop-color:var(--color-primary)]" />
          <stop offset="100%" className="[stop-color:var(--color-chart-5)]" />
        </linearGradient>
        <linearGradient id="kash-coin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" className="[stop-color:var(--color-accent)]" />
          <stop offset="100%" className="[stop-color:var(--color-coin)]" />
        </linearGradient>
      </defs>
      
      {/* Gradient background */}
      <circle cx="32" cy="32" r="30" fill="url(#kash-bg-gradient)" />
      
      {/* Subtle shine */}
      <ellipse cx="22" cy="18" rx="10" ry="6" className="fill-white/10" />
      
      {/* Piggy body with highlight */}
      <ellipse cx="30" cy="36" rx="18" ry="14" className="fill-primary-foreground" />
      <ellipse cx="28" cy="34" rx="14" ry="10" className="fill-primary-foreground/80" />
      
      {/* Legs with detail */}
      <rect x="14" y="44" width="6" height="9" rx="3" className="fill-primary-foreground" />
      <rect x="34" y="44" width="6" height="9" rx="3" className="fill-primary-foreground" />
      <ellipse cx="17" cy="53" rx="3.5" ry="1" className="fill-foreground/10" />
      <ellipse cx="37" cy="53" rx="3.5" ry="1" className="fill-foreground/10" />
      
      {/* Ear with inner detail */}
      <ellipse cx="18" cy="26" rx="6" ry="8" className="fill-primary-foreground" transform="rotate(-20 18 26)" />
      <ellipse cx="18" cy="26" rx="3.5" ry="5" className="fill-primary/25" transform="rotate(-20 18 26)" />
      
      {/* Head */}
      <ellipse cx="44" cy="36" rx="9" ry="11" className="fill-primary-foreground" />
      
      {/* Snout with nostrils */}
      <ellipse cx="51" cy="38" rx="6" ry="7" className="fill-primary/30" />
      <ellipse cx="51" cy="37" rx="4" ry="5" className="fill-primary/20" />
      <circle cx="52" cy="35" r="1.8" className="fill-primary/50" />
      <circle cx="52" cy="40" r="1.8" className="fill-primary/50" />
      
      {/* Eye with more detail */}
      <ellipse cx="42" cy="31" rx="4.5" ry="5" className="fill-card" />
      <circle cx="43" cy="30" r="2.5" className="fill-foreground/85" />
      <circle cx="44" cy="29" r="1" className="fill-card" />
      
      {/* Eyebrow */}
      <path d="M38 26 Q42 24, 46 26" className="stroke-foreground/15" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      {/* Coin slot with gradient */}
      <rect x="23" y="18" width="14" height="5" rx="2.5" fill="url(#kash-coin-gradient)" />
      <rect x="26" y="19.5" width="8" height="2" rx="1" className="fill-coin-foreground/30" />
      
      {/* Sparkle on slot */}
      <circle cx="35" cy="19" r="1" className="fill-white/60" />
      
      {/* Curly tail */}
      <path 
        d="M11 36 C7 36, 4 31, 7 26 C10 21, 15 24, 12 30 C10 34, 8 33, 9 36" 
        className="stroke-primary-foreground fill-none" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      
      {/* Cheeks - rosy */}
      <ellipse cx="47" cy="42" rx="4" ry="2.5" className="fill-chart-5/40" />
      
      {/* Happy mouth */}
      <path d="M48 44 Q51 46, 54 44" className="stroke-primary/40" strokeWidth="1" strokeLinecap="round" fill="none" />
      
      {/* Coin with shine */}
      <circle cx="30" cy="12" r="5" className="fill-coin" />
      <circle cx="30" cy="12" r="3.5" className="fill-coin/80" stroke="none" />
      <text x="30" y="14" textAnchor="middle" className="fill-coin-foreground/70" fontSize="6" fontWeight="bold">$</text>
      <ellipse cx="28" cy="10" rx="2" ry="1" className="fill-white/40" />
    </svg>
  )
}

// Outline Logo - Line art side view
function KashLogoOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-label="Kash Logo">
      {/* Outer circle */}
      <circle cx="32" cy="32" r="29" className="stroke-primary" strokeWidth="2" fill="none" />
      
      {/* Body outline */}
      <ellipse cx="30" cy="36" rx="16" ry="12" className="stroke-primary" strokeWidth="2" fill="none" />
      
      {/* Legs */}
      <rect x="18" y="44" width="5" height="6" rx="2.5" className="stroke-primary" strokeWidth="1.5" fill="none" />
      <rect x="34" y="44" width="5" height="6" rx="2.5" className="stroke-primary" strokeWidth="1.5" fill="none" />
      
      {/* Ear */}
      <ellipse cx="20" cy="28" rx="4" ry="5" className="stroke-primary" strokeWidth="1.5" fill="none" transform="rotate(-15 20 28)" />
      
      {/* Head */}
      <ellipse cx="42" cy="36" rx="7" ry="9" className="stroke-primary" strokeWidth="2" fill="none" />
      
      {/* Snout */}
      <ellipse cx="48" cy="38" rx="4" ry="5" className="stroke-primary" strokeWidth="1.5" fill="none" />
      <circle cx="49" cy="36" r="1" className="fill-primary" />
      <circle cx="49" cy="40" r="1" className="fill-primary" />
      
      {/* Eye */}
      <circle cx="41" cy="32" r="2.5" className="stroke-primary" strokeWidth="1.5" fill="none" />
      <circle cx="41" cy="32" r="1" className="fill-primary" />
      
      {/* Coin slot */}
      <rect x="25" y="22" width="10" height="3" rx="1.5" className="stroke-accent" strokeWidth="1.5" fill="none" />
      
      {/* Tail */}
      <path d="M14 36 C10 36, 9 32, 11 28" className="stroke-primary fill-none" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Monochrome Logo - Single color side view
function KashLogoMonochrome({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-label="Kash Logo">
      {/* Background */}
      <circle cx="32" cy="32" r="30" className="fill-foreground" />
      
      {/* Piggy body */}
      <ellipse cx="30" cy="36" rx="17" ry="13" className="fill-background" />
      
      {/* Legs */}
      <rect x="16" y="44" width="5" height="7" rx="2.5" className="fill-background" />
      <rect x="34" y="44" width="5" height="7" rx="2.5" className="fill-background" />
      
      {/* Ear */}
      <ellipse cx="19" cy="27" rx="4" ry="6" className="fill-background" transform="rotate(-15 19 27)" />
      <ellipse cx="19" cy="27" rx="2" ry="3" className="fill-foreground/20" transform="rotate(-15 19 27)" />
      
      {/* Head */}
      <ellipse cx="43" cy="36" rx="8" ry="10" className="fill-background" />
      
      {/* Snout */}
      <ellipse cx="49" cy="38" rx="5" ry="6" className="fill-foreground/15" />
      <circle cx="50" cy="36" r="1.5" className="fill-foreground/30" />
      <circle cx="50" cy="40" r="1.5" className="fill-foreground/30" />
      
      {/* Eye */}
      <circle cx="41" cy="32" r="2.5" className="fill-foreground" />
      
      {/* Coin slot */}
      <rect x="24" y="21" width="12" height="4" rx="2" className="fill-foreground/30" />
      
      {/* Tail */}
      <path d="M13 36 C9 36, 8 32, 10 29" className="stroke-background fill-none" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// App Icon Version - Optimized for app store icons
export function KashAppIcon({ className }: { className?: string }) {
  return (
    <div className={`bg-primary rounded-[22%] p-2 ${className}`}>
      <KashLogoDefault className="w-full h-full" />
    </div>
  )
}

// Favicon Version - Ultra simplified side view for tiny sizes
export function KashFavicon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-label="Kash">
      <circle cx="16" cy="16" r="15" className="fill-primary" />
      {/* Simplified body */}
      <ellipse cx="14" cy="18" rx="9" ry="7" className="fill-primary-foreground/95" />
      {/* Head */}
      <ellipse cx="22" cy="18" rx="5" ry="6" className="fill-primary-foreground/95" />
      {/* Ear */}
      <ellipse cx="9" cy="13" rx="2" ry="3" className="fill-primary-foreground/95" transform="rotate(-15 9 13)" />
      {/* Snout */}
      <ellipse cx="26" cy="19" rx="2.5" ry="3" className="fill-primary/30" />
      <circle cx="26.5" cy="18" r="0.8" className="fill-primary/50" />
      <circle cx="26.5" cy="20" r="0.8" className="fill-primary/50" />
      {/* Eye */}
      <circle cx="21" cy="16" r="1.5" className="fill-foreground/70" />
      {/* Coin slot */}
      <rect x="11" y="10" width="6" height="2" rx="1" className="fill-coin" />
      {/* Legs */}
      <rect x="8" y="23" width="3" height="4" rx="1.5" className="fill-primary-foreground/95" />
      <rect x="17" y="23" width="3" height="4" rx="1.5" className="fill-primary-foreground/95" />
      {/* Tail hint */}
      <path d="M5 18 C4 16, 5 14, 6 15" className="stroke-primary-foreground/95 fill-none" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Logo with wordmark - For headers and brand presence
export function KashWordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-10 h-10", text: "text-xl" },
    lg: { icon: "w-14 h-14", text: "text-2xl" },
  }
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <KashLogoDefault className={sizes[size].icon} />
      <span className={`font-display font-bold text-foreground ${sizes[size].text}`}>
        Kash
      </span>
    </div>
  )
}
