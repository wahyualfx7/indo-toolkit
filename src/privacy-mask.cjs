'use strict';

/** Mask digits only; keep punctuation and the rightmost visible digits. */
function maskDigits(input, visibleEnd = 4, maskChar = '*') {
  if (typeof input !== 'string') throw new TypeError('input harus string');
  if (!Number.isInteger(visibleEnd) || visibleEnd < 0) throw new RangeError('visibleEnd harus >= 0');
  if (typeof maskChar !== 'string' || [...maskChar].length !== 1) throw new TypeError('maskChar harus satu karakter');
  let remaining = Math.max(0, (input.match(/\d/g) || []).length - visibleEnd);
  return input.replace(/\d/g, digit => remaining-- > 0 ? maskChar : digit);
}

function maskSensitive(text, options = {}) {
  if (typeof text !== 'string') throw new TypeError('text harus string');
  const types = options.types ?? ['nik', 'npwp', 'phone', 'bank'];
  const visibleEnd = options.visibleEnd ?? 4;
  const maskChar = options.maskChar ?? '*';
  const all = {
    nik: /\b(NIK\s*[:#=-]?\s*)((?:\d[ .-]?){15}\d)\b/gi,
    npwp: /\b(NPWP\s*[:#=-]?\s*)((?:\d[ .-]?){14,19}\d)\b/gi,
    phone: /\b((?:nomor\s*)?(?:hp|wa|whatsapp|telepon|telp)\s*[:#=-]?\s*)(\+?62[\d .()-]{9,17}|08[\d .()-]{8,15})/gi,
    bank: /\b((?:no(?:mor)?\.?\s*(?:rek(?:ening)?|rekening)|rekening|rek\.)\s*[:#=-]?\s*)((?:\d[ .-]?){7,19}\d)\b/gi,
  };
  if (!Array.isArray(types) || types.some(t => !Object.hasOwn(all, t))) throw new TypeError('types tidak valid');
  // Only labeled patterns are masked, because 10-16 bare digits can be ambiguous.
  let result = text;
  for (const type of types) {
    result = result.replace(all[type], (_, label, value) => `${label}${maskDigits(value, visibleEnd, maskChar)}`);
  }
  return result;
}

module.exports = { maskDigits, maskSensitive };
