'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseIndoDate, parseBank, convertUnit, parseUnit, parseMoney,
  generateDocumentNumber, cleanPhone, maskDigits, maskSensitive, parseOrder } = require('../index.cjs');

test('chatDate: waktu relatif, jam sore, dan zona WIB', () => {
  assert.deepEqual(parseIndoDate('besok jam 3 sore', {reference: '2026-10-16'}), {
    date: '2026-10-17', time: '15:00', localDateTime: '2026-10-17T15:00:00',
    timeZone: 'Asia/Jakarta', warnings: [],
  });
});
test('chatDate: jumat depan berarti Jumat mendatang', () => {
  assert.equal(parseIndoDate('jumat depan jam 8 malam', {reference: '2026-10-16'}).date, '2026-10-23');
  assert.equal(parseIndoDate('jumat depan jam 8 malam', {reference: '2026-10-16'}).time, '20:00');
});
test('chatDate: tanggal eksplisit dan masa tahun depan', () => {
  assert.equal(parseIndoDate('25 oktober jam 14.30', {reference: '2026-11-01'}).date, '2027-10-25');
  assert.equal(parseIndoDate('25/10/2026 pukul 14:30', {reference: '2026-10-16'}).time, '14:30');
  assert.equal(parseIndoDate('31 februari 2026', {reference: '2026-10-16'}), null);
});
test('chatDate: tanpa tanggal atau ambigu tidak mengarang jam', () => {
  assert.equal(parseIndoDate('halo', {reference:'2026-10-16'}), null);
  const result = parseIndoDate('besok jam 3', {reference:'2026-10-16'});
  assert.equal(result.time, null);
  assert.equal(result.warnings.length, 1);
});

test('bankParser: nama, bank, rekening format bebas', () => {
  assert.deepEqual(parseBank('BCA 1234567890 a.n. Budi'), {
    bank: 'BCA', accountNumber: '1234567890', accountName: 'Budi', verified: false,
  });
  assert.equal(parseBank('transfer bank BRI no rek: 1234-5678-9012').accountNumber, '123456789012');
});
test('bankParser: tidak mengira nomor WA sebagai rekening', () => {
  assert.equal(parseBank('No WA: 081234567890'), null);
  const res = parseBank('BCA, WA 081234567890');
  assert.equal(res.accountNumber, null);
});

test('unitParser: kodi, lusin, rim, ons dan desimal', () => {
  assert.deepEqual(parseUnit('2 kodi kaos'), {
    quantity: 2, unit:'kodi', baseQuantity:40, baseUnit:'pcs', remainder:'kaos',
  });
  assert.equal(parseUnit('2,5 ons gula').baseQuantity, 250);
  assert.equal(convertUnit(1,'rim').baseQuantity, 500);
  assert.equal(convertUnit(3,'lusin').baseQuantity, 36);
  assert.equal(convertUnit(1, 'nggak-ada'), null);
});

test('textMoney: teks bilangan sampai jutaan', () => {
  assert.equal(parseMoney('dua ratus lima puluh ribu rupiah'), 250000);
  assert.equal(parseMoney('satu juta dua ratus lima puluh ribu'), 1250000);
  assert.equal(parseMoney('seribu dua ratus'), 1200);
  assert.equal(parseMoney('nol rupiah'), 0);
});
test('textMoney: Rp, jutaan koma, dan input tidak valid', () => {
  assert.equal(parseMoney('Rp1.250.000'), 1250000);
  assert.equal(parseMoney('1,5 juta'), 1500000);
  assert.equal(parseMoney('25rb'), 25000);
  assert.equal(parseMoney('100.000,00'), 100000);
  assert.equal(parseMoney('satu belas'), null);
  assert.equal(parseMoney('abc'), null);
  assert.equal(parseMoney('1,5'), null);
});

test('documentNumber: default dan kustom bulan Romawi', () => {
  assert.equal(generateDocumentNumber({prefix:'INV', date:'2026-10-16', sequence: 7}), 'INV/2026/10/0007');
  assert.equal(generateDocumentNumber({prefix:'SURAT', date:'2026-10-16', sequence:7,
    pattern:'{seq}/{prefix}/{romanMonth}/{yyyy}'}), '0007/SURAT/X/2026');
  assert.throws(() => generateDocumentNumber({sequence:0}), /sequence/);
  assert.throws(() => generateDocumentNumber({sequence:1,date:'2026-02-31'}), /date/);
});

test('contactCleaner: format lokal, internasional, dan wa.me', () => {
  const expected = {national:'081234567890', e164:'+6281234567890', whatsapp:'6281234567890'};
  for (const form of ['0812 3456 7890', '+62 812-3456-7890', '6281234567890',
    '81234567890', 'https://wa.me/6281234567890']) assert.deepEqual(cleanPhone(form), expected);
  assert.equal(cleanPhone('01234'), null);
  assert.equal(cleanPhone('hello 081234567890'), null);
});

test('privacyMask: masking label NIK, WA, nomor rekening', () => {
  const result = maskSensitive('NIK: 3174012345678901, WA: 081234567890; rekening: 1234567890');
  assert.ok(result.includes('NIK: ************8901'));
  assert.ok(result.includes('WA: ********7890'));
  assert.ok(result.includes('rekening: ******7890'));
  assert.equal(maskDigits('1234-5678-90', 2), '****-****-90');
  assert.equal(maskSensitive('no order 123456789012'), 'no order 123456789012');
});

test('orderParser: modul legasi terintegrasi', () => {
  const result = parseOrder('Pesan 2 kaos hitam, alamat Depok, bayar COD');
  assert.equal(result.items[0].quantity, 2);
  assert.equal(result.customer.address, 'Depok');
  assert.equal(result.payment.method, 'cod');
});

test('subpath exports: modul individual dapat require', () => {
  const { parseMoney: money } = require('indo-toolkit/text-money');
  assert.equal(money('lima ribu'), 5000);
  const { cleanPhone: clean } = require('indo-toolkit/contact-cleaner');
  assert.equal(clean('081234567890')?.whatsapp, '6281234567890');
});
