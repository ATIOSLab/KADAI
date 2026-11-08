/**
 * ESC/POS Binary Command Encoder for 58mm / 80mm Thermal Receipt Printers
 * Standard EPSON ESC/POS protocol compatible (Sunmi, Panda, Xprinter, Epson, GOOJPRT)
 */

export interface ReceiptData {
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
  laundryTrackingToken?: string | null;
  laundryJobCode?: string | null;
}

export type PaperWidth = 58 | 80;

export class EscPosEncoder {
  private buffer: number[] = [];
  private charsPerLine: number;

  constructor(paperWidth: PaperWidth = 58) {
    this.charsPerLine = paperWidth === 80 ? 48 : 32;
    this.init();
  }

  public init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @ - Initialize printer
    return this;
  }

  public alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  public alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  public alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  public bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  public textSize(width: 1 | 2 = 1, height: 1 | 2 = 1): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 0x20); // Basic ASCII safety
    }
    return this;
  }

  public line(str: string = ""): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  public feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  public divider(char: string = "-"): this {
    this.line(char.repeat(this.charsPerLine));
    return this;
  }

  public doubleDivider(): this {
    this.line("=".repeat(this.charsPerLine));
    return this;
  }

  public twoColumns(left: string, right: string): this {
    const totalSpaces = this.charsPerLine - left.length - right.length;
    if (totalSpaces > 0) {
      this.line(left + " ".repeat(totalSpaces) + right);
    } else {
      // Left text is too long, truncate or split
      const maxLeft = Math.max(1, this.charsPerLine - right.length - 1);
      const truncatedLeft = left.slice(0, maxLeft);
      const spaces = this.charsPerLine - truncatedLeft.length - right.length;
      this.line(truncatedLeft + " ".repeat(Math.max(1, spaces)) + right);
    }
    return this;
  }

  public cut(partial: boolean = false): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, partial ? 0x01 : 0x00); // GS V
    return this;
  }

  public kickDrawer(): this {
    // Pulse to cash drawer pin 2: ESC p 0 25 250
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  public encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

function formatRp(val: number): string {
  return "Rp" + Math.round(val).toLocaleString("id-ID");
}

/**
 * Generate binary ESC/POS payload from receipt data
 */
export function buildEscPosReceipt(data: ReceiptData, paperWidth: PaperWidth = 58): Uint8Array {
  const enc = new EscPosEncoder(paperWidth);

  // 1. Header (Centered)
  enc.alignCenter();
  enc.bold(true).textSize(2, 2);
  enc.line(data.storeName || "KADAI");
  enc.bold(false).textSize(1, 1);

  if (data.outletName) {
    enc.line(data.outletName);
  }
  if (data.outletAddress) {
    enc.line(data.outletAddress);
  }
  if (data.outletPhone) {
    enc.line(`Telp: ${data.outletPhone}`);
  }

  // 2. Divider
  enc.divider("-");

  // 3. Metadata (Key-Value)
  enc.alignLeft();
  enc.twoColumns("No. Invoice", data.invoiceNumber);

  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleString("id-ID", {
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
  enc.twoColumns("Waktu", dateStr);

  const cashier = data.cashierName ? data.cashierName.split("(")[0].trim() : "Kasir";
  enc.twoColumns("Kasir", cashier);

  const orderTypeStr = (data.orderType || "DINE_IN") + (data.tableNo ? ` (Meja ${data.tableNo})` : "");
  enc.twoColumns("Layanan", orderTypeStr);

  if (data.customerName) {
    enc.twoColumns("Pelanggan", data.customerName);
  }

  // 4. Items Divider
  enc.divider("-");

  // 5. Items List
  data.items.forEach((item) => {
    enc.line(item.name);
    const qtyPrice = `${item.quantity} x ${formatRp(item.unitPrice)}`;
    const total = formatRp(item.totalPrice);
    enc.twoColumns(`  ${qtyPrice}`, total);

    if (item.discountAmount && item.discountAmount > 0) {
      enc.twoColumns("  (Diskon)", `-${formatRp(item.discountAmount)}`);
    }
  });

  // 6. Totals Divider
  enc.divider("-");

  // 7. Subtotals & Charges
  enc.twoColumns("Subtotal", formatRp(data.subtotal));

  if (data.discountAmount && data.discountAmount > 0) {
    enc.twoColumns("Diskon Promosi", `-${formatRp(data.discountAmount)}`);
  }
  if (data.serviceCharge && data.serviceCharge > 0) {
    enc.twoColumns("Service Charge", formatRp(data.serviceCharge));
  }
  if (data.taxAmount && data.taxAmount > 0) {
    enc.twoColumns("PB1 / Pajak Resto", formatRp(data.taxAmount));
  }
  if (data.roundingAmount && data.roundingAmount !== 0) {
    const sign = data.roundingAmount > 0 ? "+" : "";
    enc.twoColumns("Pembulatan", `${sign}${formatRp(data.roundingAmount)}`);
  }

  // 8. Total Bayar (Bold, Double Width if possible)
  enc.doubleDivider();
  enc.bold(true);
  enc.twoColumns("TOTAL BAYAR", formatRp(data.totalAmount));
  enc.bold(false);

  // 9. Payment Details
  enc.divider("-");
  const paymentLabels: Record<string, string> = {
    CASH: "TUNAI",
    BANK_TRANSFER: "TRANSFER BANK",
    QRIS: "QRIS",
    E_WALLET: "E-WALLET",
  };
  enc.twoColumns("Metode Bayar", paymentLabels[data.paymentType] || data.paymentType);

  if (data.paymentRef) {
    enc.twoColumns("Ref Transaksi", data.paymentRef);
  }
  if (data.cashReceived && data.cashReceived > 0) {
    enc.twoColumns("Uang Diterima", formatRp(data.cashReceived));
    enc.twoColumns("Kembalian", formatRp(data.changeAmount || 0));
  }

  // 9.5 Laundry Tracking Link if exists
  if (data.laundryTrackingToken) {
    enc.divider("-");
    enc.alignCenter();
    enc.bold(true);
    enc.line("LACAK STATUS CUCIAN");
    enc.bold(false);
    enc.line(`kadai.asia/lacak/${data.laundryTrackingToken}`);
    if (data.laundryJobCode) {
      enc.line(`No Resi: ${data.laundryJobCode}`);
    }
  }

  // 10. Footer (Centered)
  enc.divider("-");
  enc.alignCenter();
  enc.line("*** TERIMA KASIH ***");
  enc.line("Barang yang sudah dibeli");
  enc.line("tidak dapat ditukar/dikembalikan");
  enc.feed(1);
  enc.line("Powered by KADAI Enterprise");

  // 11. Feed & Cut
  enc.cut();

  return enc.encode();
}
