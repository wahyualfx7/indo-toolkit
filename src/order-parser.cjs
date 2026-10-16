'use strict';

/**
 * IndoOrderParser v0.1.0
 * Parser heuristik tanpa AI atau koneksi internet. Input ambigu tetap perlu
 * validasi manusia sebelum diproses sebagai transaksi nyata.
 */

const PHONE_RE = /(?:\+?62[\s().-]*|0)8(?:[\s().-]*\d){8,12}/g;
const MONEY_VALUE = '(?:rp\\.?\\s*)?\\d+(?:[.,]\\d+)*(?:\\s*(?:ribu|rb|k|juta|jt))?';
const MONEY_UNIT = '(?:ribu|rb|k|juta|jt)';
const AMOUNT_WITH_MARKER_RE = new RegExp(`(?:\\bRp\\.?\\s*\\d+(?:[.,]\\d+)*|\\b\\d+(?:[.,]\\d+)*\\s*${MONEY_UNIT}\\b)`, 'i');
const PRICE_AT_RE = new RegExp(`@\\s*(${MONEY_VALUE})`, 'i');
const PRICE_LABEL_RE = new RegExp(`\\b(?:harga(?:\\s+satuan)?|per\\s*(?:pcs|buah|unit|item))\\s*[:=]?\\s*(${MONEY_VALUE})`, 'i');
const QUANTITY_UNIT = '(?:pcs?|buah|unit|pack|pak|pax|set|botol|lembar|kotak|box)';
const ORDER_PREFIX_RE = /^(?:(?:halo|hai|hi|kak|kakak|min|admin)[\s,!.]*)?(?:(?:saya|aku|gue|gua|kami)\s+)?(?:(?:mau|ingin|tolong|boleh|minta)\s+)?(?:pesan(?:in)?|order|beli|checkout|ambil|booking)\b\s*[:=-]?\s*/i;
const GREET_RE = /^(?:halo|hai|hi|ass?alamualaikum|selamat\s+(?:pagi|siang|sore|malam)|terima\s+kasih|makasih|thanks|oke|ok|siap)(?:\s+(?:kak|admin|min))?[!.,\s]*$/i;
const FIELD_LABELS = [
  ['name', /^(?:nama(?:\s+(?:penerima|pembeli|customer))?|penerima|atas\s+nama)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['phone', /^(?:no(?:mor)?[\s.\-]*(?:hp|wa|telepon|telp)|nomor\s+whatsapp|hp|wa|whatsapp|telepon|telp)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['address', /^(?:alamat(?:\s+(?:kirim|pengiriman|penerima|lengkap))?|kirim\s+ke|dikirim\s+ke|tujuan\s+kirim)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['note', /^(?:catatan|note|notes|pesan\s+untuk\s+penjual|keterangan)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['total', /^(?:grand\s+total|total(?:\s+(?:bayar|pembayaran|harga))?)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['payment', /^(?:metode\s+pembayaran|cara\s+bayar|pembayaran|payment|bayar|via)\s*(?:[:=\-]\s*|\s+)(.+)$/i],
  ['items', /^(?:pesanan|daftar\s+(?:barang|pesanan)|produk|barang|item|items|orderan|order)\s*[:=\-]\s*(.+)$/i],
];
const STANDALONE_HEAD_RE = /^(?:pesanan|daftar\s+(?:barang|pesanan)|produk|barang|item|items|orderan|order)\s*[:=\-]?\s*$/i;
const ADDRESS_CONTINUATION_RE = /^(?:rt\b|rw\b|kel(?:urahan)?\b|kec(?:amatan)?\b|kode\s+pos\b|blok\b|no\.?\s*\d|kab(?:upaten)?\b|kota\b|provinsi\b|patokan\b)/i;

function tidy(value) {
  return String(value).replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function cleanSegment(value) {
  return tidy(value).replace(/^[\s\-*•\d]+[.)](?=\s)/u, '').replace(/^[\s\-*•]+/u, '')
    .replace(/[.\s]+$/u, '').trim();
}

/** @returns {number | null} amount in integer Rupiah */
function parseRupiah(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? value : null;
  if (typeof value !== 'string') return null;
  const text = tidy(value).toLowerCase();
  const match = text.match(/^(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)(?:\s*(ribu|rb|k|juta|jt))?$/i);
  if (!match) return null;
  const numText = match[1];
  const suffix = match[2];
  let amount;
  if (suffix) {
    const parts = numText.match(/[.,]/g) || [];
    // 1.500k is interpreted as 1500k, while 1,5jt is 1.5 million.
    const groupThousands = /^\d{1,3}(?:[.,]\d{3})+$/.test(numText);
    if (groupThousands) amount = Number(numText.replace(/[.,]/g, ''));
    else if (parts.length <= 1) amount = Number(numText.replace(',', '.'));
    else return null;
    amount *= /^(?:juta|jt)$/.test(suffix) ? 1_000_000 : 1_000;
  } else {
    if (/\d+[.,]\d{1,2}$/.test(numText) && !/^\d{1,3}(?:[.,]\d{3})+$/.test(numText)) return null;
    amount = Number(numText.replace(/[.,]/g, ''));
  }
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

/** Returns canonical +62 mobile format as 628..., or null when invalid. */
function normalizePhone(value) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  const canonical = digits.startsWith('08') ? `62${digits.slice(1)}` : digits;
  return /^628\d{8,11}$/.test(canonical) ? canonical : null;
}

function findPhone(text) {
  const hits = String(text).match(PHONE_RE) || [];
  for (const hit of hits) {
    const canonical = normalizePhone(hit);
    if (canonical) return canonical;
  }
  return null;
}

function extractLabel(segment) {
  for (const [key, regex] of FIELD_LABELS) {
    const match = segment.match(regex);
    if (match) return {key, value: tidy(match[1])};
  }
  return null;
}

function extractPayment(text) {
  const s = text.toLowerCase();
  // An explicitly negated method should not be detected as selected.
  const patterns = [
    { method: 'cod', provider: null, re: /\b(?:bayar\s+|via\s+|metode\s+|pembayaran\s+)?(?:cod|bayar\s+di\s+tempat)\b/gi },
    { method: 'qris', provider: null, re: /\bqris\b/gi },
    ...['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'].map(provider => ({
      method: 'ewallet', provider: provider === 'gopay' ? 'GoPay' : provider === 'shopeepay' ? 'ShopeePay' : provider === 'linkaja' ? 'LinkAja' : provider.toUpperCase(),
      re: new RegExp(`\\b${provider}\\b`, 'gi'),
    })),
    { method: 'bank_transfer', provider: null, re: /\b(?:transfer|tf|bank)\b/gi },
    { method: 'cash', provider: null, re: /\b(?:tunai|cash)\b/gi },
  ];
  const found = [];
  for (const p of patterns) {
    for (const match of s.matchAll(p.re)) {
      const before = s.slice(Math.max(0, match.index - 13), match.index);
      if (/\b(?:tidak|jangan|bukan|tanpa|non)[\s:]*$/.test(before)) continue;
      found.push({idx: match.index, method: p.method, provider: p.provider});
    }
  }
  if (found.length === 0) return {method: 'unknown', provider: null};
  found.sort((a, b) => a.idx - b.idx);
  const first = found[0];
  if (first.method === 'bank_transfer') {
    const providerMatch = s.match(/\b(?:bca|bri|bni|mandiri|bsi|cimb|permata|jago|seabank)\b/i);
    return {method: first.method, provider: providerMatch ? providerMatch[0].toUpperCase() : null};
  }
  return {method: first.method, provider: first.provider};
}

function stripPaymentTail(segment) {
  return segment.replace(/(?:\s+|[,;]\s*)(?:(?:bayar(?:nya)?|pembayaran|via|pakai|metode\s+bayar)\s*:?[ \t]*)?(?:cod|bayar\s+di\s+tempat|qris|gopay|ovo|dana|shopeepay|linkaja|transfer(?:\s+(?:bank|bca|bri|bni|mandiri|bsi|cimb|permata|jago|seabank))?|tf(?:\s+(?:bca|bri|bni|mandiri))?|tunai|cash)\s*$/i, '').trim();
}

function extractPrice(segment) {
  let match = segment.match(PRICE_AT_RE) || segment.match(PRICE_LABEL_RE);
  if (!match) {
    // At the end of an item, only an explicit currency/suffix is accepted.
    const found = [...segment.matchAll(new RegExp(AMOUNT_WITH_MARKER_RE.source, 'gi'))];
    if (found.length) {
      const candidate = found[found.length - 1];
      if (!segment.slice(candidate.index + candidate[0].length).trim()) match = [candidate[0], candidate[0]];
    }
  }
  if (!match) return {text: segment, price: null};
  const price = parseRupiah(match[1]);
  if (price === null) return {text: segment, price: null};
  return {
    text: tidy(segment.replace(match[0], '')),
    price,
  };
}

function parseItem(segment) {
  let s = cleanSegment(segment);
  s = s.replace(/^(?:saya|aku|gua|gue)\s+(?:mau|ingin)\s+/i, '');
  s = s.replace(ORDER_PREFIX_RE, '');
  s = s.replace(/^(?:pesanan|produk|barang|items?|orderan)\s*[:=\-]\s*/i, '');
  s = stripPaymentTail(s);
  const priceData = extractPrice(s);
  s = priceData.text;
  let quantity = 1;
  let matched;
  // Prefix: 2x kaos, 2 pcs kaos, 2 kaos
  matched = s.match(/^(\d{1,4})\s*(?:x|×)\s+(.+)$/i)
    || s.match(new RegExp(`^(\\d{1,4})\\s*${QUANTITY_UNIT}\\s+(.+)$`, 'i'))
    || s.match(/^(\d{1,4})\s+(.+)$/);
  if (matched) {
    quantity = Number(matched[1]);
    s = matched[2];
  } else {
    matched = s.match(new RegExp(`^(.+?)\\s+(?:sebanyak\\s+)?(?:x\\s*)?(\\d{1,4})\\s*${QUANTITY_UNIT}?\\s*$`, 'i'));
    if (matched) {
      quantity = Number(matched[2]);
      s = matched[1];
    } else {
      matched = s.match(/^(.+?)\s+[x×]\s*(\d{1,4})$/i);
      if (matched) {
        quantity = Number(matched[2]);
        s = matched[1];
      }
    }
  }
  s = tidy(s).replace(/^[:\-\s]+|[.!\s]+$/g, '');
  // Never guess entries from metadata, numeric-only lines, or greetings.
  if (!s || !/[a-z\p{L}]/iu.test(s) || GREET_RE.test(s) || /^(?:cod|qris|transfer|tf|tunai|cash)$/i.test(s)
      || /^(?:alamat|nama|wa|hp|catatan|total)\b/i.test(s)
      || /^\+?\d[\d\s()-]+$/.test(s)
      || s.length > 150 || quantity < 1 || quantity > 9999) return null;
  const subtotal = priceData.price === null ? null : priceData.price * quantity;
  if (subtotal !== null && !Number.isSafeInteger(subtotal)) return null;
  return {name: s, quantity, unitPrice: priceData.price, subtotal};
}

function splitItemSegments(text) {
  return text
    .split(/\s*[,;\n]\s*/g)
    .flatMap(part => part.split(/\s+(?:dan|\+|&)\s+(?=\d{1,4}\s*(?:x\s*|pcs?\s*|buah\s*|unit\s*)?\S)/i))
    .map(cleanSegment).filter(Boolean);
}

function parseOrder(text) {
  if (typeof text !== 'string') throw new TypeError('parseOrder menerima teks (string).');
  const normalized = text.replace(/\r\n?/g, '\n').trim();
  const customer = {name: null, phone: null, address: null};
  const warnings = [];
  const unparsedSegments = [];
  const content = [];
  let note = null;
  let declaredTotal = null;
  let lastAddress = false;
  const payment = extractPayment(normalized);

  for (const rawLine of normalized.split('\n')) {
    let line = cleanSegment(rawLine);
    if (!line) continue;
    if (STANDALONE_HEAD_RE.test(line)) { lastAddress = false; continue; }
    // Allow inline comma fields: "2 kaos, alamat Depok, bayar COD".
    const segments = line.split(/\s*[,;]\s*/g).map(cleanSegment).filter(Boolean);
    for (const seg of segments) {
      const match = extractLabel(seg);
      if (match) {
        lastAddress = false;
        switch (match.key) {
          case 'name': customer.name = customer.name || match.value; break;
          case 'phone': customer.phone = customer.phone || findPhone(match.value); break;
          case 'address': customer.address = customer.address ? `${customer.address}, ${match.value}` : match.value; lastAddress = true; break;
          case 'note': note = note ? `${note}; ${match.value}` : match.value; break;
          case 'total': declaredTotal = parseRupiah(match.value); break;
          case 'payment': break;
          case 'items': content.push(match.value); break;
        }
      } else if (lastAddress && (ADDRESS_CONTINUATION_RE.test(seg) || !/^(?:\d{1,4}\s*(?:x\s*|pcs?\s*|buah\s*)?\S)/i.test(seg))) {
        customer.address += `, ${seg}`;
      } else {
        content.push(seg);
        lastAddress = false;
      }
    }
  }
  customer.phone = customer.phone || findPhone(normalized);

  const items = [];
  for (const seg of content.flatMap(splitItemSegments)) {
    const clean = stripPaymentTail(seg);
    if (!clean || GREET_RE.test(clean)) continue;
    const item = parseItem(clean);
    if (item) items.push(item);
    else unparsedSegments.push(seg);
  }
  if (!items.length) warnings.push('Tidak ada produk yang berhasil dikenali. Periksa teks pesanan secara manual.');
  if (unparsedSegments.length) warnings.push('Ada bagian pesan yang tidak dikenali; periksa unparsedSegments.');
  if (declaredTotal !== null && items.length && items.every(item => item.subtotal !== null)) {
    const itemSum = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (itemSum !== declaredTotal) warnings.push('Total yang ditulis berbeda dengan subtotal barang (mungkin termasuk ongkir/diskon).');
  }
  return {
    customer,
    items,
    payment,
    note,
    currency: 'IDR',
    itemsSubtotal: items.length && items.every(item => item.subtotal !== null)
      ? items.reduce((sum, item) => sum + item.subtotal, 0)
      : null,
    declaredTotal,
    warnings,
    unparsedSegments,
  };
}

function parseOrders(texts) {
  if (!Array.isArray(texts)) throw new TypeError('parseOrders menerima array string.');
  return texts.map(parseOrder);
}

module.exports = {parseOrder, parseOrders, parseRupiah, normalizePhone};
