'use strict';

const ONES = Object.freeze({ nol: 0, satu: 1, dua: 2, tiga: 3, empat: 4, lima: 5,
  enam: 6, tujuh: 7, delapan: 8, sembilan: 9 });
const SCALES = Object.freeze({ triliun: 1e12, miliar: 1e9, milyar: 1e9, juta: 1e6, ribu: 1e3 });

function parseSmall(tokens) {
  if (!tokens.length) return null;
  let i = 0, total = 0;
  if (tokens[i] === 'seratus') { total = 100; i += 1; }
  else if (ONES[tokens[i]] >= 1 && tokens[i + 1] === 'ratus') {
    total = ONES[tokens[i]] * 100; i += 2;
  }
  const rest = tokens.slice(i);
  if (!rest.length) return total || null;
  if (rest.length === 1 && rest[0] === 'nol' && total === 0) return 0;
  if (rest[0] === 'sepuluh' && rest.length === 1) return total + 10;
  if (rest[0] === 'sebelas' && rest.length === 1) return total + 11;
  if (ONES[rest[0]] >= 2 && rest[1] === 'belas' && rest.length === 2) return total + 10 + ONES[rest[0]];
  if (ONES[rest[0]] >= 2 && rest[1] === 'puluh') {
    if (rest.length === 2) return total + ONES[rest[0]] * 10;
    if (rest.length === 3 && ONES[rest[2]] >= 1) return total + ONES[rest[0]] * 10 + ONES[rest[2]];
  }
  if (rest.length === 1 && ONES[rest[0]] >= 1) return total + ONES[rest[0]];
  return null;
}

function parseSpokenMoney(value) {
  const words = value.split(/\s+/).filter(Boolean);
  if (!words.length) return null;
  let total = 0;
  let current = [];
  let lastScale = Infinity;
  for (const word of words) {
    if (word === 'seribu' || word === 'sejuta') {
      const scale = word === 'seribu' ? 1e3 : 1e6;
      if (current.length || scale >= lastScale) return null;
      total += scale; lastScale = scale;
      continue;
    }
    const scale = SCALES[word];
    if (scale !== undefined) {
      if (scale >= lastScale) return null;
      const part = parseSmall(current);
      if (part === null || part < 1) return null;
      total += part * scale;
      lastScale = scale;
      current = [];
    } else {
      current.push(word);
    }
  }
  if (current.length) {
    const trailing = parseSmall(current);
    if (trailing === null) return null;
    total += trailing;
  }
  return Number.isSafeInteger(total) ? total : null;
}

/** Parse whole-Rupiah amounts (not fractional sen). Unknown or ambiguous input => null. */
function parseMoney(input) {
  if (typeof input === 'number') return Number.isSafeInteger(input) && input >= 0 ? input : null;
  if (typeof input !== 'string') return null;
  let value = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!value) return null;
  value = value.replace(/\s+rupiah$/i, '').trim();
  value = value.replace(/^rp\.?\s*/i, '').trim();
  const numeric = value.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?\s*(ribu|rb|k|juta|jt|miliar|milyar|triliun)?$/i);
  if (numeric) {
    const whole = numeric[1].replace(/\./g, '');
    const fraction = numeric[2];
    const scale = numeric[3]?.toLowerCase();
    const multiplier = { ribu: 1e3, rb: 1e3, k: 1e3, juta: 1e6, jt: 1e6,
      miliar: 1e9, milyar: 1e9, triliun: 1e12 }[scale] ?? 1;
    if (fraction && !scale && !/^0+$/.test(fraction)) return null;
    const result = Number(whole) * multiplier + (fraction ? Number(`0.${fraction}`) * multiplier : 0);
    return Number.isSafeInteger(result) ? result : null;
  }
  return parseSpokenMoney(value);
}

module.exports = { parseMoney };
