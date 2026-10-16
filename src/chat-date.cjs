'use strict';

const DAYS = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const MONTHS = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

function makeDay(year, month, date) {
  const day = new Date(Date.UTC(year, month - 1, date));
  if (day.getUTCFullYear() !== year || day.getUTCMonth() !== month - 1 || day.getUTCDate() !== date) return null;
  return day;
}

function getReference(reference, timeZone) {
  if (typeof reference === 'string') {
    const r = reference.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!r) throw new TypeError('reference harus YYYY-MM-DD atau Date');
    const day = makeDay(+r[1], +r[2], +r[3]);
    if (!day) throw new RangeError('reference tidak valid');
    return day;
  }
  if (!(reference instanceof Date) || Number.isNaN(reference.getTime())) throw new TypeError('reference tidak valid');
  const parts = new Intl.DateTimeFormat('en-US', { timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(reference);
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return makeDay(+map.year, +map.month, +map.day);
}

function addDays(date, amount) {
  return new Date(date.getTime() + amount * 86400000);
}

function parseTime(input, warnings) {
  let found = input.match(/\b(?:jam|pukul)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?\b/i);
  if (!found) {
    const standalone = input.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (!standalone) return null;
    found = [standalone[0], standalone[1], standalone[2], null];
  }
  let hour = +found[1];
  const minute = found[2] === undefined ? 0 : +found[2];
  const period = found[3]?.toLowerCase();
  if (hour > 23 || minute > 59 || (period && hour > 12)) {
    warnings.push('Jam atau menit tidak valid.');
    return null;
  }
  if (!period && hour > 0 && hour <= 12 && found[0].match(/^(?:jam|pukul)\s*/i)) {
    warnings.push('Jam 1–12 tanpa keterangan pagi/siang/sore/malam dianggap ambigu.');
    return null;
  }
  if (period === 'pagi' && hour === 12) hour = 0;
  if (period === 'siang' || period === 'sore') {
    if (hour >= 1 && hour <= 11) hour += 12;
  }
  if (period === 'malam') {
    if (hour === 12) hour = 0;
    else if (hour >= 6 && hour <= 11) hour += 12;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Return a local wall-clock date and time (not an instant) for the selected IANA timezone. */
function parseIndoDate(input, options = {}) {
  if (typeof input !== 'string') return null;
  const text = input.toLowerCase().replace(/jum['’]?at/g, 'jumat').trim();
  if (!text) return null;
  const timeZone = options.timeZone ?? 'Asia/Jakarta';
  const reference = getReference(options.reference ?? new Date(), timeZone);
  const warnings = [];
  let day = null;
  const slashDate = text.match(/\b(?:tanggal\s+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  const naturalDate = text.match(/\b(?:tanggal\s+)?(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)(?:\s+(\d{4}))?\b/);
  if (slashDate || naturalDate) {
    const d = slashDate ?? naturalDate;
    const yearIsExplicit = !!(slashDate || naturalDate[3]);
    const month = slashDate ? +d[2] : MONTHS.indexOf(d[2]) + 1;
    let year = yearIsExplicit ? +d[3] : reference.getUTCFullYear();
    day = makeDay(year, month, +d[1]);
    if (!day) return null;
    if (!yearIsExplicit && day < reference) {
      year += 1;
      day = makeDay(year, month, +d[1]);
      if (!day) return null;
    }
  } else if (/\b(?:hari ini|sekarang)\b/.test(text)) day = reference;
  else if (/\blusa\b/.test(text)) day = addDays(reference, 2);
  else if (/\bbesok\b/.test(text)) day = addDays(reference, 1);
  else if (/\bkemarin\b/.test(text)) day = addDays(reference, -1);
  else if (/\bminggu depan\b/.test(text)) day = addDays(reference, 7);
  else {
    const weekday = text.match(/\b(minggu|senin|selasa|rabu|kamis|jumat|sabtu)(?:\s+depan)?\b/);
    if (weekday) {
      let offset = (DAYS.indexOf(weekday[1]) - reference.getUTCDay() + 7) % 7;
      if (offset === 0) offset = 7;
      day = addDays(reference, offset);
    }
  }
  if (!day) return null;
  const date = day.toISOString().slice(0, 10);
  const time = parseTime(text, warnings);
  return { date, time, localDateTime: time ? `${date}T${time}:00` : null, timeZone, warnings };
}

module.exports = { parseIndoDate };
