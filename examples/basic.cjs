'use strict';
const {
  parseIndoDate, parseBank, parseUnit, parseMoney, generateDocumentNumber,
  cleanPhone, maskSensitive, parseOrder,
} = require('../index.cjs');

const examples = {
  tanggal: parseIndoDate('besok jam 3 sore', { reference: '2026-10-16' }),
  bank: parseBank('BCA 1234567890 a.n. Budi'),
  satuan: parseUnit('2,5 kodi kaos'),
  rupiah: parseMoney('dua ratus lima puluh ribu rupiah'),
  nomorDokumen: generateDocumentNumber({ prefix: 'INV', date: '2026-10-16', sequence: 12 }),
  telepon: cleanPhone('+62 812-3456-7890'),
  disamarkan: maskSensitive('NIK: 3174012345678901, WA: 081234567890'),
  pesanan: parseOrder('Pesan 2 kaos hitam, alamat Depok, bayar COD'),
};
console.log(JSON.stringify(examples, null, 2));
