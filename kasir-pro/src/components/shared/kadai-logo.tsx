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
      ? "#FFFFFF"
      : variant === "monochrome"
        ? "currentColor"
        : "#020617";

  const curveStroke =
    variant === "white"
      ? "#FFFFFF"
      : variant === "monochrome"
        ? "currentColor"
        : "#EA580C";

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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Kadai Logo"
    >
      {/* 1. Batang Tegak (Vertical Stem) */}
      <rect x="18" y="14" width="16" height="72" rx="8" fill={stemFill} />

      {/* 2. Lengkung Wajan (Wok Edge Curve - sweeping arm of K) */}
      <path
        d="M38 66 C 46 66, 68 62, 78 30"
        stroke={curveStroke}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M48 54 L 80 82"
        stroke={curveStroke}
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* 3. Percikan Api (Spark Dot - Amber Accent) */}
      <circle cx="82" cy="18" r="8" fill={sparkFill} />
    </svg>
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
      <KadaiLogoMark size={logoSize} />
      <div className="flex flex-col">
        <div className="flex items-baseline leading-none">
          <span
            className={cn(
              "text-xl font-extrabold tracking-tight",
              textColor ?? "text-slate-950 dark:text-white"
            )}
            style={{ fontFamily: "var(--font-sans)" }}
          >
            KADAI
          </span>
          <span className="text-[#EA580C] font-black text-2xl leading-none">
            .
          </span>
        </div>
        {showTagline && (
          <span
            className="text-[9px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.16em] uppercase mt-0.5"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
}
