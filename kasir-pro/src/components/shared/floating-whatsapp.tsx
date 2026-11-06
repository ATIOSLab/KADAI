"use client";

import { MessageCircle } from "lucide-react";

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export function FloatingWhatsApp({
  phoneNumber = "6285159081119",
  defaultMessage = "Halo Tim KADAI (PT Netkrida), saya ingin konsultasi dan jadwalkan demo sistem operasional KADAI untuk usaha saya.",
}: FloatingWhatsAppProps) {
  const encodedMessage = encodeURIComponent(defaultMessage);
  const waUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group">
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Konsultasi WhatsApp PT Netkrida"
        className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white pl-3.5 pr-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
      >
        <MessageCircle className="size-5 fill-white text-[#25D366]" />
        <span className="text-xs font-bold tracking-tight hidden sm:inline-block">
          Chat WhatsApp Demo
        </span>
      </a>
    </div>
  );
}
