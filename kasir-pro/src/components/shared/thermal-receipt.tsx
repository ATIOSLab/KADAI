"use client";

import { formatCurrency } from "@/lib/utils";

export interface ThermalReceiptProps {
  storeName?: string;
  outletName?: string;
  outletAddress?: string | null;
  outletPhone?: string | null;
  invoiceNumber: string;
  createdAt?: string | Date;
  cashierName?: string | null;
  customerName?: string | null;
  orderType?: string;
  tableNo?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discountAmount?: number;
  }>;
  subtotal: number;
  discountAmount?: number;
  serviceCharge?: number;
  taxAmount?: number;
  roundingAmount?: number;
  totalAmount: number;
  paymentType: string;
  paymentRef?: string | null;
  cashReceived?: number | null;
  changeAmount?: number | null;
  preview?: boolean;
}

export function ThermalReceipt({
  storeName = "KADAI",
  outletName,
  outletAddress,
  outletPhone,
  invoiceNumber,
  createdAt,
  cashierName,
  customerName,
  orderType,
  tableNo,
  items,
  subtotal,
  discountAmount = 0,
  serviceCharge = 0,
  taxAmount = 0,
  roundingAmount = 0,
  totalAmount,
  paymentType,
  paymentRef,
  cashReceived,
  changeAmount,
  preview = false,
}: ThermalReceiptProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const paymentLabels: Record<string, string> = {
    CASH: "TUNAI",
    BANK_TRANSFER: "TRANSFER BANK",
    QRIS: "QRIS",
    E_WALLET: "E-WALLET",
  };

  const renderContent = () => (
    <div
      className="w-full text-black leading-relaxed select-text tracking-tight"
      style={{
        fontFamily: "var(--font-mono), 'Geist Mono', Consolas, 'Liberation Mono', Menlo, 'Courier New', monospace",
      }}
    >
      {/* Header */}
      <div className="text-center pb-2.5 border-b border-dashed border-black/60 space-y-1">
        <h2 className="font-black text-sm sm:text-base tracking-widest uppercase">{storeName}</h2>
        {outletName && <p className="font-bold text-xs text-black">{outletName}</p>}
        {outletAddress && <p className="text-[11px] text-black/80 leading-tight max-w-[280px] mx-auto">{outletAddress}</p>}
        {outletPhone && <p className="text-[11px] text-black/80">Telp: {outletPhone}</p>}
      </div>

      {/* Meta Info */}
      <div className="py-2.5 border-b border-dashed border-black/60 text-[11px] space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-black/80">No. Invoice</span>
          <span className="font-bold">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black/80">Waktu</span>
          <span className="font-medium">{formattedDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black/80">Kasir</span>
          <span className="font-semibold">{cashierName ? cashierName.split('(')[0].trim() : "Kasir"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-black/80">Layanan</span>
          <span className="font-bold text-black">{orderType || "DINE_IN"}{tableNo ? ` • Meja ${tableNo}` : ""}</span>
        </div>
        {customerName && (
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-black/80">Pelanggan</span>
            <span className="font-semibold">{customerName}</span>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="py-2.5 border-b border-dashed border-black/60 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-0.5 text-xs">
            <div className="font-bold text-black leading-tight">{item.name}</div>
            <div className="flex justify-between items-baseline text-[11px]">
              <span className="text-black/80 font-medium">
                {item.quantity} x {formatCurrency(item.unitPrice)}
                {item.discountAmount && item.discountAmount > 0
                  ? ` (Disc -${formatCurrency(item.discountAmount)})`
                  : ""}
              </span>
              <span className="font-bold text-black tabular-nums">{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="py-2.5 border-b border-dashed border-black/60 space-y-1 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-black/80">Subtotal</span>
          <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center text-red-700 font-medium">
            <span>Diskon Promosi</span>
            <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {serviceCharge > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-black/80">Service Charge</span>
            <span className="font-semibold tabular-nums">{formatCurrency(serviceCharge)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-black/80">PB1 / Pajak Resto</span>
            <span className="font-semibold tabular-nums">{formatCurrency(taxAmount)}</span>
          </div>
        )}
        {roundingAmount !== 0 && (
          <div className="flex justify-between items-center">
            <span className="text-black/80">Pembulatan</span>
            <span className="font-semibold tabular-nums">{roundingAmount > 0 ? `+${formatCurrency(roundingAmount)}` : formatCurrency(roundingAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center font-black text-xs sm:text-sm pt-2 mt-1 border-t border-solid border-black">
          <span>TOTAL BAYAR</span>
          <span className="tabular-nums">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment details */}
      <div className="py-2.5 border-b border-dashed border-black/60 space-y-1 text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-black/80">Metode Bayar</span>
          <span className="font-bold uppercase">{paymentLabels[paymentType] || paymentType}</span>
        </div>
        {paymentRef && (
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-black/75">Ref Transaksi</span>
            <span>{paymentRef}</span>
          </div>
        )}
        {cashReceived !== undefined && cashReceived !== null && cashReceived > 0 && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-black/80">Uang Diterima</span>
              <span className="font-semibold tabular-nums">{formatCurrency(cashReceived)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xs pt-0.5">
              <span>Kembalian</span>
              <span className="tabular-nums">{formatCurrency(changeAmount || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 text-center space-y-1">
        <p className="font-bold text-xs tracking-wider">*** TERIMA KASIH ***</p>
        <p className="text-[10px] text-black/75 leading-tight">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
        <p className="text-[10px] text-black/60 pt-1 font-sans font-medium tracking-wide">Powered by KADAI Enterprise POS</p>
      </div>
    </div>
  );

  return (
    <>
      {preview && (
        <div className="w-full max-w-[340px] mx-auto rounded-xl border border-slate-200/90 bg-white p-5 shadow-xl transition-all">
          <div className="mb-2 pb-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-sans font-semibold text-slate-500">
            <span>Pratinjau Struk Thermal (58/80mm)</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">ESC/POS</span>
          </div>
          {renderContent()}
        </div>
      )}

      <div id="thermal-receipt-print-area" className="hidden">
        {renderContent()}
      </div>
    </>
  );
}
