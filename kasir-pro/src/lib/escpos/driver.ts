/**
 * Web Bluetooth and WebUSB Direct Hardware Driver for ESC/POS Thermal Printers
 * Browser API: navigator.bluetooth / navigator.usb
 */

import { buildEscPosReceipt, type ReceiptData, type PaperWidth, EscPosEncoder } from "./encoder";

export type ConnectionType = "bluetooth" | "usb" | "none";

export interface PrinterConfig {
  type: ConnectionType;
  deviceName: string | null;
  paperWidth: PaperWidth;
  kickDrawer: boolean;
}

const STORAGE_KEY = "kadai:printer_config";

// Standard Bluetooth Thermal Printer GATT Services & Characteristics
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Common POS printers
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Portable RPP02 / Panda
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent
  "0000ff00-0000-1000-8000-00805f9b34fb", // Custom POS
  0x18f0,
  0xff00,
];

class ThermalPrinterDriver {
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private usbDevice: any = null;
  private usbEndpointNumber: number = 1;

  public config: PrinterConfig = {
    type: "none",
    deviceName: null,
    paperWidth: 58,
    kickDrawer: false,
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.loadConfig();
    }
  }

  public loadConfig(): PrinterConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch {
      // Fallback to default
    }
    return this.config;
  }

  public saveConfig(config: Partial<PrinterConfig>) {
    this.config = { ...this.config, ...config };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    }
  }

  public isBluetoothSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  public isUsbSupported(): boolean {
    return typeof navigator !== "undefined" && "usb" in navigator;
  }

  public isConnected(): boolean {
    return (
      (this.config.type === "bluetooth" && this.bluetoothDevice?.gatt?.connected) ||
      (this.config.type === "usb" && this.usbDevice?.opened)
    );
  }

  /**
   * Connect via Web Bluetooth
   */
  public async connectBluetooth(): Promise<string> {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth tidak didukung oleh browser ini. Gunakan Chrome atau Edge.");
    }

    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: PRINTER_SERVICES }],
      optionalServices: PRINTER_SERVICES,
    });

    if (!device) throw new Error("Tidak ada perangkat yang dipilih");

    const server = await device.gatt.connect();

    // Find the writable characteristic
    let writeChar: any = null;
    for (const serviceUuid of PRINTER_SERVICES) {
      try {
        const service = await server.getPrimaryService(serviceUuid);
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
        if (writeChar) break;
      } catch {
        continue;
      }
    }

    if (!writeChar) {
      throw new Error("Karakteristik ESC/POS tidak ditemukan pada printer ini.");
    }

    this.bluetoothDevice = device;
    this.bluetoothCharacteristic = writeChar;

    const deviceName = device.name || "Thermal Bluetooth Printer";
    this.saveConfig({
      type: "bluetooth",
      deviceName,
    });

    return deviceName;
  }

  /**
   * Connect via WebUSB
   */
  public async connectUsb(): Promise<string> {
    if (!this.isUsbSupported()) {
      throw new Error("WebUSB tidak didukung oleh browser ini. Gunakan Chrome atau Edge.");
    }

    const nav = navigator as any;
    const device = await nav.usb.requestDevice({
      filters: [{ classCode: 0x07 }, { classCode: 0xff }], // Printer class or vendor specific
    });

    if (!device) throw new Error("Tidak ada printer USB yang dipilih");

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    // Find out endpoint
    const iface = device.configuration.interfaces[0];
    const endpoint = iface.alternate.endpoints.find((e: any) => e.direction === "out");
    if (!endpoint) throw new Error("Endpoint output USB tidak ditemukan.");

    this.usbDevice = device;
    this.usbEndpointNumber = endpoint.endpointNumber;

    const deviceName = device.productName || "Thermal USB Printer";
    this.saveConfig({
      type: "usb",
      deviceName,
    });

    return deviceName;
  }

  public disconnect() {
    if (this.bluetoothDevice?.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    if (this.usbDevice?.opened) {
      this.usbDevice.close();
    }
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.usbDevice = null;
    this.saveConfig({ type: "none", deviceName: null });
  }

  /**
   * Send binary payload to hardware
   */
  public async sendRaw(data: Uint8Array): Promise<void> {
    if (this.config.type === "bluetooth") {
      if (!this.bluetoothCharacteristic) {
        throw new Error("Printer Bluetooth belum terhubung.");
      }

      // Chunk data into 128-byte packets to prevent BLE buffer overflow
      const chunkSize = 128;
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        if (this.bluetoothCharacteristic.writeValueWithoutResponse) {
          await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.bluetoothCharacteristic.writeValue(chunk);
        }
        // Small delay between packets
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    } else if (this.config.type === "usb") {
      if (!this.usbDevice || !this.usbDevice.opened) {
        throw new Error("Printer USB belum terhubung.");
      }
      await this.usbDevice.transferOut(this.usbEndpointNumber, data);
    } else {
      throw new Error("Tidak ada printer hardware yang terhubung.");
    }
  }

  /**
   * Print a test strip
   */
  public async printTest(): Promise<void> {
    const enc = new EscPosEncoder(this.config.paperWidth);
    enc.alignCenter();
    enc.bold(true).textSize(2, 2);
    enc.line("KADAI POS");
    enc.bold(false).textSize(1, 1);
    enc.line("Printer Hardware Siap");
    enc.divider("-");
    enc.alignLeft();
    enc.line(`Mode: ${this.config.type.toUpperCase()}`);
    enc.line(`Lebar Kertas: ${this.config.paperWidth}mm`);
    enc.line(`Waktu: ${new Date().toLocaleTimeString("id-ID")}`);
    enc.divider("-");
    enc.alignCenter();
    enc.line("Koneksi ESC/POS Berhasil!");
    enc.cut();

    await this.sendRaw(enc.encode());
  }

  /**
   * Print a full receipt
   */
  public async printReceipt(data: ReceiptData): Promise<void> {
    const payload = buildEscPosReceipt(data, this.config.paperWidth);
    await this.sendRaw(payload);
  }
}

export const thermalPrinter = new ThermalPrinterDriver();
