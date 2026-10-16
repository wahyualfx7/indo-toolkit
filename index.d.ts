/** Parsed day and optional wall-clock time. NOT UTC timestamp. */
export interface IndoDateResult {
  date: string;
  time: string | null;
  localDateTime: string | null;
  timeZone: string;
  warnings: string[];
}
export function parseIndoDate(text: string, options?: { reference?: Date | string; timeZone?: string }): IndoDateResult | null;

export interface BankResult {
  bank: string | null;
  accountNumber: string | null;
  accountName: string | null;
  /** Always false: parsing is not bank-account verification. */
  verified: false;
}
export function parseBank(text: string): BankResult | null;

export interface UnitResult {
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
}
export function convertUnit(quantity: number, unit: string): UnitResult | null;
export function parseUnit(text: string): (UnitResult & { remainder: string }) | null;

export function parseMoney(value: number | string): number | null;

export interface DocumentNumberOptions {
  sequence: number;
  date?: string | Date;
  prefix?: string;
  suffix?: string;
  padding?: number;
  /** Placeholders: prefix, suffix, yyyy, yy, MM, dd, romanMonth, seq */
  pattern?: string;
}
export function generateDocumentNumber(options: DocumentNumberOptions): string;

export interface PhoneResult {
  national: string;
  e164: string;
  whatsapp: string;
}
export function cleanPhone(input: string | number): PhoneResult | null;

export function maskDigits(text: string, visibleEnd?: number, maskChar?: string): string;
export function maskSensitive(text: string, options?: {
  types?: Array<'nik' | 'npwp' | 'phone' | 'bank'>;
  visibleEnd?: number;
  maskChar?: string;
}): string;

export type PaymentMethod = 'cod' | 'bank_transfer' | 'ewallet' | 'qris' | 'cash' | 'unknown';
export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number | null;
  subtotal: number | null;
}
export interface ParsedOrder {
  customer: { name: string | null; phone: string | null; address: string | null };
  items: OrderItem[];
  payment: { method: PaymentMethod; provider: string | null };
  note: string | null;
  currency: 'IDR';
  itemsSubtotal: number | null;
  declaredTotal: number | null;
  warnings: string[];
  unparsedSegments: string[];
}
export function parseOrder(text: string): ParsedOrder;
export function parseOrders(texts: string[]): ParsedOrder[];
export function parseRupiah(value: string | number): number | null;
export function normalizePhone(value: string): string | null;
