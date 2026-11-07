import React from "react";
import { cn } from "@/lib/utils";

export type KadaiLogoVariant =
  | "brand"
  | "on-dark"
  | "on-light"
  | "white"
  | "monochrome"
  | "mono-black"
  | "mono-white"
  | "mono-orange";

export interface KadaiLogoProps {
  className?: string;
  size?: number | string;
  variant?: KadaiLogoVariant;
  sparkColor?: string;
}

/**
 * Kadai Brand Mark (Lettermark K)
 * Geometric construction from official KADAI Brand Icon Pack:
 * 1. Batang Tegak (Vertical Stem): Kokoh, stabil, modern
 * 2. Lengkung Wajan (Wok Edge Curve): Dinamis, hangat, F&B DNA
 * 3. Percikan Api (Spark Dot): Energi, pertumbuhan, amber glow
 */
export function KadaiLogoMark({
  className,
  size = 32,
  variant = "brand",
  sparkColor,
}: KadaiLogoProps) {
  // Pure Monochromes (Zero Gradients - Ideal for thermal printers & 1-bit icons)
  if (variant === "mono-black") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-label="Kadai Logo Mono Black"
      >
        <g fill="#000000">
          <rect x="120" y="78" width="60" height="356" rx="30" />
          <circle cx="408" cy="150" r="22" />
        </g>
        <g stroke="#000000" strokeWidth="60" strokeLinecap="round" fill="none">
          <path d="M212 256L350 114" />
          <path d="M212 256A150 150 0 0 1 362 406" />
        </g>
      </svg>
    );
  }

  if (variant === "mono-white" || variant === "white") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-label="Kadai Logo Mono White"
      >
        <g fill="#FFFFFF">
          <rect x="120" y="78" width="60" height="356" rx="30" />
          <circle cx="408" cy="150" r="22" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="60" strokeLinecap="round" fill="none">
          <path d="M212 256L350 114" />
          <path d="M212 256A150 150 0 0 1 362 406" />
        </g>
      </svg>
    );
  }

  if (variant === "mono-orange") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-label="Kadai Logo Mono Orange"
      >
        <g fill="#EA580C">
          <rect x="120" y="78" width="60" height="356" rx="30" />
          <circle cx="408" cy="150" r="22" />
        </g>
        <g stroke="#EA580C" strokeWidth="60" strokeLinecap="round" fill="none">
          <path d="M212 256L350 114" />
          <path d="M212 256A150 150 0 0 1 362 406" />
        </g>
      </svg>
    );
  }

  // Full color variants (on-light vs on-dark/brand)
  const isLight = variant === "on-light";
  const stemFill = isLight ? "#0F172A" : "url(#kadai-gs)";
  const sparkFill = sparkColor ?? "#F59E0B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Kadai Logo"
    >
      <defs>
        <linearGradient id="kadai-ga" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="kadai-gl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="kadai-gs" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="kadai-gs-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>

      {/* 1. Batang Tegak (Vertical Stem) */}
      <rect x="120" y="78" width="60" height="356" rx="30" fill={stemFill} />

      {/* 2. Lengkung Wajan & Kaki Diagonal K */}
      <path
        d="M212 256L350 114"
        stroke="url(#kadai-ga)"
        strokeWidth="60"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M212 256A150 150 0 0 1 362 406"
        stroke="url(#kadai-gl)"
        strokeWidth="60"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3. Percikan Api (Spark Dot - Amber Accent) */}
      <circle cx="408" cy="150" r="22" fill={sparkFill} />
    </svg>
  );
}

export function KadaiWordmark({
  className,
  textColor = "text-slate-950 dark:text-white",
  size = "text-2xl",
}: {
  className?: string;
  textColor?: string;
  size?: string;
}) {
  return (
    <span
      className={cn(
        "font-bold inline-flex items-baseline lowercase select-none font-wordmark",
        size,
        textColor,
        className
      )}
      style={{
        fontFamily: "'Bahnschrift', var(--font-saira), 'Segoe UI', 'DIN Alternate', -apple-system, sans-serif",
        letterSpacing: "-0.045em",
        fontWeight: 700,
      }}
      aria-label="kadai"
    >
      <span>kada</span>
      <span className="relative inline-flex items-baseline">
        <span>ı</span>
        <span className="absolute top-[0.12em] left-1/2 -translate-x-1/2 size-[0.24em] rounded-full bg-[#F59E0B]" />
      </span>
    </span>
  );
}

export interface KadaiBrandProps {
  className?: string;
  showTagline?: boolean;
  taglineText?: string;
  logoSize?: number;
  textColor?: string;
  responsive?: boolean;
}

/**
 * App Icon Squircle Master (from svg/kadai-app-icon-*.svg)
 * Ideal for Tablet POS Home Screen, Mobile Launcher, and High-Impact Badges
 */
export function KadaiAppIcon({
  size = 48,
  variant = "dark",
  className,
}: {
  size?: number | string;
  variant?: "dark" | "dark-circle" | "light" | "orange";
  className?: string;
}) {
  if (variant === "orange") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
      >
        <rect width="512" height="512" rx="116" fill="#EA580C" />
        <g fill="#fff">
          <rect x="120" y="78" width="60" height="356" rx="30" />
          <circle cx="408" cy="150" r="22" />
        </g>
        <g stroke="#fff" strokeWidth="60" strokeLinecap="round" fill="none">
          <path d="M212 256L350 114" />
          <path d="M212 256A150 150 0 0 1 362 406" />
        </g>
      </svg>
    );
  }

  if (variant === "light") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
      >
        <defs>
          <linearGradient id="ai-gt-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <linearGradient id="ai-ga" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#FB923C" />
          </linearGradient>
          <linearGradient id="ai-gl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="116" fill="url(#ai-gt-light)" stroke="#E2E8F0" strokeWidth="8" />
        <rect x="120" y="78" width="60" height="356" rx="30" fill="#0F172A" />
        <path d="M212 256L350 114" stroke="url(#ai-ga)" strokeWidth="60" strokeLinecap="round" fill="none" />
        <path d="M212 256A150 150 0 0 1 362 406" stroke="url(#ai-gl)" strokeWidth="60" strokeLinecap="round" fill="none" />
        <circle cx="408" cy="150" r="22" fill="#F59E0B" />
      </svg>
    );
  }

  const isCircle = variant === "dark-circle";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="ai-gt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="ai-ga-d" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="ai-gl-d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="ai-gs-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      {isCircle ? (
        <circle cx="256" cy="256" r="256" fill="url(#ai-gt)" />
      ) : (
        <rect width="512" height="512" rx="116" fill="url(#ai-gt)" />
      )}
      <rect x="120" y="78" width="60" height="356" rx="30" fill="url(#ai-gs-d)" />
      <path d="M212 256L350 114" stroke="url(#ai-ga-d)" strokeWidth="60" strokeLinecap="round" fill="none" />
      <path d="M212 256A150 150 0 0 1 362 406" stroke="url(#ai-gl-d)" strokeWidth="60" strokeLinecap="round" fill="none" />
      <circle cx="408" cy="150" r="22" fill="#F59E0B" />
    </svg>
  );
}

/**
 * Kadai Brand Header (Device-Adaptive Lockup)
 * Automatically adapts between Mobile (compact header) and Desktop (full lockup)
 */
export function KadaiBrandHeader({
  className,
  showTagline = true,
  taglineText = "SISTEM OPERASI BISNIS",
  logoSize = 34,
  textColor,
  responsive = true,
}: KadaiBrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      <KadaiLogoMark size={logoSize} variant="on-light" className="shrink-0" />
      <div className="flex flex-col justify-center min-w-0">
        <KadaiWordmark textColor={textColor} size="text-xl sm:text-2xl" />
        {showTagline && (
          <span
            className={cn(
              "text-[8px] sm:text-[8.5px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.18em] uppercase font-sans truncate",
              responsive ? "hidden sm:block mt-0.5" : "mt-0.5"
            )}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * KADAI PRIMARY LOGO (Logo Utama)
 * Mandat Brand: Logo utama BUKAN hanya simbol K sendirian,
 * melainkan kombinasi utuh Simbol Huruf K + Wordmark "kadaı" secara bersamaan.
 * Bersifat free-standing (berdiri bebas tanpa kotak pembungkus) sesuai master lockup resmi.
 */
export function KadaiPrimaryLogo({
  className,
  size = "md",
  variant = "on-light",
  layout = "horizontal",
  showTagline = false,
  taglineText = "SISTEM OPERASI BISNIS",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "on-light" | "on-dark" | "mono-black" | "mono-white";
  layout?: "horizontal" | "stacked";
  showTagline?: boolean;
  taglineText?: string;
}) {
  const isDark = variant === "on-dark" || variant === "mono-white";

  const sizeConfig = {
    sm: { markSize: 26, wordmarkSize: "text-lg", taglineSize: "text-[7.5px]" },
    md: { markSize: 34, wordmarkSize: "text-2xl", taglineSize: "text-[8.5px]" },
    lg: { markSize: 44, wordmarkSize: "text-3xl", taglineSize: "text-[10px]" },
    xl: { markSize: 58, wordmarkSize: "text-4xl", taglineSize: "text-[12px]" },
  }[size];

  const logoMarkVariant =
    variant === "mono-black"
      ? "mono-black"
      : variant === "mono-white"
        ? "mono-white"
        : variant === "on-dark"
          ? "on-dark"
          : "on-light";

  if (layout === "stacked") {
    return (
      <div className={cn("inline-flex flex-col items-center text-center gap-2", className)}>
        <KadaiLogoMark size={sizeConfig.markSize} variant={logoMarkVariant} />
        <div className="flex flex-col items-center">
          <KadaiWordmark
            size={sizeConfig.wordmarkSize}
            textColor={isDark ? "text-white" : "text-slate-950"}
          />
          {showTagline && (
            <span
              className={cn(
                "font-bold tracking-[0.2em] uppercase font-sans mt-0.5",
                sizeConfig.taglineSize,
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {taglineText}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 sm:gap-3", className)}>
      <KadaiLogoMark size={sizeConfig.markSize} variant={logoMarkVariant} className="shrink-0" />
      <div className="flex flex-col justify-center min-w-0 text-left">
        <KadaiWordmark
          size={sizeConfig.wordmarkSize}
          textColor={isDark ? "text-white" : "text-slate-950"}
        />
        {showTagline && (
          <span
            className={cn(
              "font-bold tracking-[0.18em] uppercase font-sans truncate",
              sizeConfig.taglineSize,
              isDark ? "text-slate-400" : "text-slate-500"
            )}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
