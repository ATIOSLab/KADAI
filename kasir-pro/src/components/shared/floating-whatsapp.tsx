"use client";

import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function FloatingWhatsApp({
  phoneNumber = "6285159081119",
  defaultMessage = "Halo Tim KADAI (NEW ASIA TECH), saya ingin konsultasi dan jadwalkan demo sistem operasional KADAI untuk usaha saya.",
}: FloatingWhatsAppProps) {
  const encodedMessage = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Konsultasi WhatsApp NEW ASIA TECH"
        className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        <MessageCircle className="size-5 fill-white text-[#25D366]" />
        <span className="text-xs font-bold tracking-tight hidden sm:inline-block">
          Konsultasi WhatsApp
        </span>
      </a>
    </div>
  );
}
