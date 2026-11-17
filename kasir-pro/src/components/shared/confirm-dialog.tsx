"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Konfirmasi dalam aplikasi, pengganti `window.confirm()`.
 *
 * Di terminal kasir yang berjalan sebagai PWA/kiosk, dialog bawaan browser
 * (confirm/alert) sering diblokir atau tidak muncul sama sekali - tombol
 * "Terima" pada transfer stok jadi tidak bereaksi tanpa pesan apa pun.
 * Provider ini memakai Dialog milik aplikasi sendiri, jadi perilakunya sama di
 * browser biasa maupun kiosk, dan bisa ditata sesuai tema.
 */
interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((msg, opts) => {
    setMessage(msg);
    setOptions(opts ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          // Menutup dialog (Esc / klik luar) = membatalkan, bukan menggantung.
          if (!next) settle(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.title ?? "Konfirmasi"}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>
          <DialogBody className="py-2" />
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {options.cancelLabel ?? "Batal"}
            </Button>
            <Button
              variant={options.variant === "danger" ? "danger" : "default"}
              onClick={() => settle(true)}
            >
              {options.confirmLabel ?? "Ya, Lanjutkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Tanpa provider, jangan sampai tombol jadi diam tanpa penjelasan:
    // jatuh ke dialog bawaan browser sebagai upaya terakhir.
    return async (message: string) =>
      typeof window === "undefined" ? false : window.confirm(message);
  }
  return ctx;
}
