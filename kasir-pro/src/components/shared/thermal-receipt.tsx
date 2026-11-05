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
}

export function ThermalReceipt({
  storeName = "KADAI POS",
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
}: ThermalReceiptProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });

  const paymentLabels: Record<string, string> = {
    CASH: "TUNAI",
    BANK_TRANSFER: "TRANSFER BANK",
    QRIS: "QRIS STATIS/DINAMIS",
    E_WALLET: "E-WALLET",
  };

  return (
    <div id="thermal-receipt-print-area" className="hidden font-mono text-[11px] text-black">
      {/* Header */}
      <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
        <h2 className="font-bold text-sm tracking-wider uppercase">{storeName}</h2>
        {outletName && <p className="font-semibold text-xs">{outletName}</p>}
        {outletAddress && <p className="text-[10px] leading-tight">{outletAddress}</p>}
        {outletPhone && <p className="text-[10px]">Telp: {outletPhone}</p>}
      </div>

      {/* Meta Info */}
      <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
        <div className="flex justify-between">
          <span>No: {invoiceNumber}</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir: {cashierName || "Kasir"}</span>
          <span>{orderType || "DINE_IN"}{tableNo ? ` (Meja ${tableNo})` : ""}</span>
        </div>
        {customerName && (
          <div>
            <span>Pelanggan: {customerName}</span>
          </div>
        )}
      </div>

      {/* Item List */}
      <div className="py-2 border-b border-dashed border-black space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-0.5">
            <div className="font-semibold">{item.name}</div>
            <div className="flex justify-between text-[10px]">
              <span>
                {item.quantity} x {formatCurrency(item.unitPrice)}
                {item.discountAmount && item.discountAmount > 0
                  ? ` (Disc -${formatCurrency(item.discountAmount)})`
                  : ""}
              </span>
              <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-black">
            <span>Diskon</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {serviceCharge > 0 && (
          <div className="flex justify-between">
            <span>Service Charge</span>
            <span>{formatCurrency(serviceCharge)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between">
            <span>PB1 / Pajak Resto</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
        )}
        {roundingAmount !== 0 && (
          <div className="flex justify-between">
            <span>Pembulatan</span>
            <span>{roundingAmount > 0 ? `+${formatCurrency(roundingAmount)}` : formatCurrency(roundingAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-dotted border-black">
          <span>TOTAL BAYAR</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Payment details */}
      <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Metode Bayar</span>
          <span className="font-semibold">{paymentLabels[paymentType] || paymentType}</span>
        </div>
        {paymentRef && (
          <div className="flex justify-between">
            <span>Ref/ID</span>
            <span>{paymentRef}</span>
          </div>
        )}
        {cashReceived !== undefined && cashReceived !== null && cashReceived > 0 && (
          <>
            <div className="flex justify-between">
              <span>Uang Diterima</span>
              <span>{formatCurrency(cashReceived)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Kembalian</span>
              <span>{formatCurrency(changeAmount || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 text-center text-[10px] space-y-0.5">
        <p className="font-semibold">*** TERIMA KASIH ***</p>
        <p className="text-[9px] text-gray-700">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
        <p className="text-[8px] text-gray-500 pt-1 font-sans">Powered by KADAI Enterprise POS</p>
      </div>
    </div>
  );
}
