'use strict';

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

function generateDocumentNumber(options = {}) {
  const { prefix = 'INV', sequence, date = new Date(), padding = 4,
    pattern = '{prefix}/{yyyy}/{MM}/{seq}', suffix = '' } = options;
  if (!Number.isSafeInteger(sequence) || sequence < 1) throw new RangeError('sequence harus integer positif');
  if (!Number.isInteger(padding) || padding < 1 || padding > 16) throw new RangeError('padding harus 1–16');
  if (typeof prefix !== 'string' || typeof suffix !== 'string' || typeof pattern !== 'string') throw new TypeError('prefix/suffix/pattern harus string');
  let year, month, day;
  if (typeof date === 'string') {
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) throw new TypeError('date harus YYYY-MM-DD');
    year = +m[1]; month = +m[2]; day = +m[3];
  } else if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const o = Object.fromEntries(parts.map(p => [p.type, p.value]));
    year = +o.year; month = +o.month; day = +o.day;
  } else throw new TypeError('date harus YYYY-MM-DD atau Date');
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) throw new RangeError('date tidak valid');
  const values = { prefix, suffix, yyyy: String(year), yy: String(year).slice(-2),
    MM: String(month).padStart(2, '0'), dd: String(day).padStart(2, '0'),
    romanMonth: ROMANS[month - 1], seq: String(sequence).padStart(padding, '0') };
  return pattern.replace(/\{(prefix|suffix|yyyy|yy|MM|dd|romanMonth|seq)\}/g, (_, key) => values[key]);
}

module.exports = { generateDocumentNumber };
