'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseOrder, parseOrders, parseRupiah, normalizePhone} = require('../src/order-parser.cjs');

test('contoh pesanan satu baris bahasa Indonesia', () => {
  const order = parseOrder('Pesan 2 kaos hitam, alamat Depok, bayar COD');
  assert.deepEqual(order.items, [{name: 'kaos hitam', quantity: 2, unitPrice: null, subtotal: null}]);
  assert.equal(order.customer.address, 'Depok');
  assert.deepEqual(order.payment, {method: 'cod', provider: null});
  assert.deepEqual(order.warnings, []);
});

test('pesanan multiline dengan harga, kontak, catatan, dan transfer bank', () => {
  const input = `Halo kak\nPesanan:\n- 2x Kaos Hitam @Rp50.000\n- 1 Topi @25rb\nNama: Budi Santoso\nNo WA: 0812-3456-7890\nAlamat: Jl. Merdeka No. 10\nRT 01 RW 02\nPembayaran: transfer BCA\nCatatan: Bungkus kado\nTotal: Rp125.000`;
  const o = parseOrder(input);
  assert.deepEqual(o.items, [
    {name: 'Kaos Hitam', quantity: 2, unitPrice: 50000, subtotal: 100000},
    {name: 'Topi', quantity: 1, unitPrice: 25000, subtotal: 25000},
  ]);
  assert.equal(o.customer.name, 'Budi Santoso');
  assert.equal(o.customer.phone, '6281234567890');
  assert.equal(o.customer.address, 'Jl. Merdeka No. 10, RT 01 RW 02');
  assert.deepEqual(o.payment, {method: 'bank_transfer', provider: 'BCA'});
  assert.equal(o.note, 'Bungkus kado');
  assert.equal(o.declaredTotal, 125000);
  assert.equal(o.itemsSubtotal, 125000);
  assert.deepEqual(o.warnings, []);
});

test('berbagai format kuantitas dan gabungan dan', () => {
  const o = parseOrder('Saya mau order 2 kaos merah dan 3 topi, bayar QRIS');
  assert.deepEqual(o.items.map(i => [i.name, i.quantity]), [['kaos merah', 2], ['topi', 3]]);
  assert.equal(o.payment.method, 'qris');
  assert.deepEqual(parseOrder('Kaos putih 3 pcs').items.map(i => [i.name, i.quantity]), [['Kaos putih', 3]]);
  assert.deepEqual(parseOrder('Kaos putih x2').items.map(i => [i.name, i.quantity]), [['Kaos putih', 2]]);
});

test('harga singkat, harga satuan, dan total parsial tidak ditebak', () => {
  const o = parseOrder('2 hoodie 75rb, 1 topi');
  assert.equal(o.items[0].subtotal, 150000);
  assert.equal(o.items[1].unitPrice, null);
  assert.equal(o.itemsSubtotal, null);
  assert.equal(parseRupiah('Rp 1.250.000'), 1250000);
  assert.equal(parseRupiah('1,5 juta'), 1500000);
  assert.equal(parseRupiah('50k'), 50000);
  assert.equal(parseRupiah('abc'), null);
});

test('ewallet dikenali dan nomor +62 dinormalisasi', () => {
  const o = parseOrder('1 tas, bayar GoPay, WA +62 812 3456 7890');
  assert.deepEqual(o.payment, {method: 'ewallet', provider: 'GoPay'});
  assert.equal(o.customer.phone, '6281234567890');
  assert.equal(normalizePhone('081234567890'), '6281234567890');
  assert.equal(normalizePhone('123456'), null);
});

test('pesanan tanpa item memberikan warning', () => {
  const o = parseOrder('Nama: Budi\nAlamat: Bandung\nBayar COD');
  assert.equal(o.items.length, 0);
  assert.match(o.warnings[0], /Tidak ada produk/);
});

test('tidak mengasumsikan metode pembayaran yang dinegasikan', () => {
  const o = parseOrder('1 kaos hitam, jangan COD');
  assert.equal(o.payment.method, 'unknown');
});

test('mendeteksi total yang berbeda dari subtotal barang', () => {
  const o = parseOrder('2 kaos @Rp50.000\nTotal: Rp120.000');
  assert.equal(o.itemsSubtotal, 100000);
  assert.equal(o.declaredTotal, 120000);
  assert.match(o.warnings.join(' '), /ongkir\/diskon/);
});

test('parseOrders memproses banyak teks', () => {
  assert.equal(parseOrders(['1 kaos', '2 topi']).length, 2);
  assert.throws(() => parseOrders('1 kaos'), TypeError);
  assert.throws(() => parseOrder(null), TypeError);
});
