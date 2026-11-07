import React from "react";
import { cn } from "@/lib/utils";

interface KadaiLogoProps {
  className?: string;
  size?: number | string;
  variant?: "brand" | "monochrome" | "white";
  sparkColor?: string;
}

/**
 * Kadai Brand Mark (Lettermark K)
 * Precision geometric construction from Brand Identity Guide:
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
  const stemFill =
    variant === "white"
      ? "url(#kadai-gs-white)"
      : variant === "monochrome"
        ? "currentColor"
        : "url(#kadai-gs)";

  const upperStroke =
    variant === "white"
      ? "#FFFFFF"
      : variant === "monochrome"
        ? "currentColor"
        : "url(#kadai-ga)";

  const lowerStroke =
    variant === "white"
      ? "#FFFFFF"
      : variant === "monochrome"
        ? "currentColor"
        : "url(#kadai-gl)";

  const sparkFill =
    sparkColor ??
    (variant === "white"
      ? "#FB923C"
      : variant === "monochrome"
        ? "currentColor"
        : "#F59E0B");

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
        stroke={upperStroke}
        strokeWidth="60"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M212 256A150 150 0 0 1 362 406"
        stroke={lowerStroke}
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
        "font-bold tracking-tight inline-flex items-baseline lowercase select-none font-heading",
        size,
        textColor
      )}
      style={{ fontFamily: "var(--font-heading)" }}
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

interface KadaiBrandProps {
  className?: string;
  showTagline?: boolean;
  taglineText?: string;
  logoSize?: number;
  textColor?: string;
}

export function KadaiBrandHeader({
  className,
  showTagline = true,
  taglineText = "SISTEM OPERASI BISNIS",
  logoSize = 34,
  textColor,
}: KadaiBrandProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-slate-950 text-white shadow-xs p-1">
        <KadaiLogoMark size={logoSize} />
      </span>
      <div className="flex flex-col justify-center">
        <KadaiWordmark textColor={textColor} size="text-2xl" />
        {showTagline && (
          <span
            className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.18em] uppercase mt-0.5 font-sans"
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
