"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  alt: string;
  className?: string;
  iconClassName?: string;
  src?: string | null;
}

export function ProductImage({
  alt,
  className,
  iconClassName,
  src,
}: ProductImageProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-main",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={120}
          height={120}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        <Package className={cn("h-6 w-6 text-text-muted", iconClassName)} />
      )}
    </div>
  );
}
