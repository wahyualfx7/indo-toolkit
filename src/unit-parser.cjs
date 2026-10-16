'use strict';

const UNITS = Object.freeze({
  kodi: { ratio: 20, baseUnit: 'pcs' },
  lusin: { ratio: 12, baseUnit: 'pcs' },
  dozen: { ratio: 12, baseUnit: 'pcs' },
  gross: { ratio: 144, baseUnit: 'pcs' },
  rim: { ratio: 500, baseUnit: 'lembar' },
  pasang: { ratio: 2, baseUnit: 'pcs' },
  ons: { ratio: 100, baseUnit: 'gram' },
  kg: { ratio: 1000, baseUnit: 'gram' },
  kilogram: { ratio: 1000, baseUnit: 'gram' },
  gram: { ratio: 1, baseUnit: 'gram' },
  g: { ratio: 1, baseUnit: 'gram' },
  liter: { ratio: 1000, baseUnit: 'ml' },
  l: { ratio: 1000, baseUnit: 'ml' },
  ml: { ratio: 1, baseUnit: 'ml' },
  meter: { ratio: 100, baseUnit: 'cm' },
  m: { ratio: 100, baseUnit: 'cm' },
  cm: { ratio: 1, baseUnit: 'cm' },
  pcs: { ratio: 1, baseUnit: 'pcs' },
  buah: { ratio: 1, baseUnit: 'pcs' },
  lembar: { ratio: 1, baseUnit: 'lembar' },
});

function convertUnit(quantity, unit) {
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0) return null;
  if (typeof unit !== 'string') return null;
  const key = unit.toLowerCase().trim();
  const config = UNITS[key];
  if (!config) return null;
  const baseQuantity = quantity * config.ratio;
  if (!Number.isFinite(baseQuantity)) return null;
  return { quantity, unit: key, baseQuantity, baseUnit: config.baseUnit };
}

function parseUnit(text) {
  if (typeof text !== 'string') return null;
  const match = text.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*(kilogram|lembar|dozen|liter|pasang|meter|lusin|gross|kodi|gram|buah|rim|ons|pcs|kg|ml|cm|g|l|m)\b(?:\s+(.*))?$/i);
  if (!match) return null;
  const parsedQuantity = Number(match[1].replace(',', '.'));
  const result = convertUnit(parsedQuantity, match[2]);
  return result ? { ...result, remainder: (match[3] || '').trim() } : null;
}

module.exports = { parseUnit, convertUnit };
