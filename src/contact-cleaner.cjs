'use strict';

/** Normalize common Indonesian mobile numbers, without contacting a carrier. */
function cleanPhone(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let text = String(input).trim();
  text = text.replace(/^https?:\/\/(?:www\.)?wa\.me\//i, '');
  if (!/^\+?[\d\s().-]+$/.test(text)) return null;
  const value = text.replace(/[^\d]/g, '');
  let national;
  if (/^08/.test(value)) national = value;
  else if (/^628/.test(value)) national = `0${value.slice(2)}`;
  else if (/^8/.test(value)) national = `0${value}`;
  else return null;
  // Mobile numbers: 08 plus 8-11 digits. Range check is structural, not activation/ownership validation.
  if (!/^08\d{8,11}$/.test(national)) return null;
  const international = `62${national.slice(1)}`;
  return { national, e164: `+${international}`, whatsapp: international };
}

module.exports = { cleanPhone };
