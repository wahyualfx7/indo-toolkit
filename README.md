# IndoToolkit 🇮🇩

Utilitas JavaScript untuk aplikasi Indonesia: baca tanggal dalam percakapan, ekstrak rekening, konversi satuan lokal, baca nominal uang, buat nomor dokumen, normalisasi ponsel, samarkan data sensitif, dan proses pesanan chat.

> **Status:** v1.0.0 — *source code* siap diuji dan dikemas secara lokal. **Belum diterbitkan ke npm**. Nama `indo-toolkit` di npm belum dipastikan tersedia. Tidak ada klaim verifikasi bank/identitas, dan input ambigu tetap harus ditinjau manusia.

## Persyaratan

- Node.js **18 atau lebih baru**
- Dependensi runtime eksternal: **0**
- CommonJS `require`, ESM `import`, TypeScript declarations
- `exports` per modul untuk impor selektif
- Lisensi MIT

## Instalasi dari source (tidak perlu npm publik)

Unduh dan ekstrak ZIP, lalu masuk ke folder `indo-toolkit`:

```bash
npm install
npm test
npm run example
npm pack --dry-run
```

Untuk menginstal dari file TGZ yang disertakan di luar folder proyek:

```bash
npm install ./indo-toolkit-1.0.0.tgz
```

Setelah **benar-benar** diterbitkan ke registri npm dengan nama yang tersedia, perintah ini dapat digunakan:

```bash
npm install indo-toolkit
```

## Ringkasan 8 modul

| Modul | API | Kegunaan |
| --- | --- | --- |
| `chat-date` | `parseIndoDate` | `besok jam 3 sore`, `jumat depan`, `25 oktober` |
| `bank-parser` | `parseBank` | Bank, nomor rekening dan pemilik (hanya ekstraksi) |
| `unit-parser` | `parseUnit`, `convertUnit` | Kodi, lusin, rim, ons, kg, liter, dll. |
| `text-money` | `parseMoney` | `dua ratus lima puluh ribu`, `Rp50.000`, `1,5 juta` |
| `document-number` | `generateDocumentNumber` | Nomor invoice/surat dengan pola fleksibel |
| `contact-cleaner` | `cleanPhone` | Nomor mobile Indonesia menjadi E.164/WA |
| `privacy-mask` | `maskSensitive`, `maskDigits` | Sembunyikan angka pada label NIK, NPWP, WA, rek. |
| `order-parser` | `parseOrder`, `parseOrders` | IndoOrderParser v0.1.0 terintegrasi |

## Contoh CommonJS

```javascript
const {
  parseIndoDate, parseBank, parseUnit, parseMoney,
  generateDocumentNumber, cleanPhone, maskSensitive, parseOrder
} = require('indo-toolkit');

console.log(parseIndoDate('besok jam 3 sore', { reference: '2026-10-16' }));
// { date: '2026-10-17', time: '15:00', localDateTime: '2026-10-17T15:00:00', timeZone: 'Asia/Jakarta', warnings: [] }

console.log(parseBank('BCA 1234567890 a.n. Budi'));
// { bank: 'BCA', accountNumber: '1234567890', accountName: 'Budi', verified: false }

console.log(parseUnit('2 kodi kaos'));
// { quantity: 2, unit: 'kodi', baseQuantity: 40, baseUnit: 'pcs', remainder: 'kaos' }

console.log(parseMoney('dua ratus lima puluh ribu rupiah'));
// 250000

console.log(generateDocumentNumber({ sequence: 7, date: '2026-10-16', prefix: 'INV' }));
// INV/2026/10/0007

console.log(cleanPhone('+62 812-3456-7890'));
// { national: '081234567890', e164: '+6281234567890', whatsapp: '6281234567890' }

console.log(maskSensitive('NIK: 3174012345678901'));
// NIK: ************8901

console.log(parseOrder('Pesan 2 kaos hitam, alamat Depok, bayar COD'));
// Objek pesanan dengan customer, items, payment, warnings, dll.
```

## Contoh ESM / impor modul tunggal

```javascript
import { parseMoney, cleanPhone } from 'indo-toolkit';
import { parseIndoDate } from 'indo-toolkit/chat-date';
import { parseOrder } from 'indo-toolkit/order-parser';

console.log(parseMoney('Rp25.000'));
console.log(cleanPhone('081234567890'));
console.log(parseIndoDate('lusa pukul 10 pagi', { reference: '2026-10-16' }));
console.log(parseOrder('Pesan 1 topi, bayar COD'));
```

## Catatan API dan batasan

### `parseIndoDate(text, options?)`
- `options.reference`: tanggal acuan berupa `YYYY-MM-DD` atau `Date` (default saat dipanggil).
- `options.timeZone`: zona IANA, default `Asia/Jakarta` (WIB). Digunakan untuk menafsirkan objek `Date` sebagai **tanggal kalender lokal**.
- `date`: `YYYY-MM-DD`; `time`: `HH:mm` atau `null`; `localDateTime`: waktu *wall-clock* tanpa offset, **bukan** UTC/ISO instant. Untuk membuat timestamp UTC, gunakan library zona waktu secara eksplisit.
- `jumat depan`: Jumat terdekat **setelah** hari acuan; `minggu depan`: tanggal acuan +7 hari. Tanggal yang tidak menyebut tahun dibaca sebagai kejadian berikutnya (jika sudah lewat, tahun berikutnya).
- `jam 3` tanpa keterangan pagi/siang/sore/malam **tidak ditebak**; `time` menjadi `null` disertai `warnings`. Gunakan `jam 3 sore` atau `pukul 15.00`.
- `null` jika tanggal tidak ditemukan atau tidak valid.

### `parseBank(text)`
- Mengenali sejumlah nama bank umum (BCA, BRI, BNI, BSI, Mandiri, BTN, CIMB Niaga, Permata, SeaBank, Jago, Jenius).
- Mengambil rekening jika dilabeli `rek/rekening` atau berdekatan dengan nama bank.
- `verified: false` **selalu**: bukan layanan verifikasi rekening atau konfirmasi kepemilikan. Periksa hasil sebelum transaksi.

### `parseUnit(text)` dan `convertUnit(quantity, unit)`
- Kodi = 20 pcs; lusin = 12 pcs; gross = 144 pcs; rim = 500 lembar; pasang = 2 pcs; ons Indonesia = 100 gram; kg = 1000 gram; liter = 1000 ml; meter = 100 cm.
- Unit tak dikenal dikembalikan `null`. Sisa kata disimpan di `remainder` oleh `parseUnit`.

### `parseMoney(input)`
- Keluaran `number` berupa Rupiah bulat, atau `null` untuk nilai ambigu/tidak valid.
- Menerima kata bilangan umum, `Rp1.250.000`, `25rb`, `1,5 juta`, `dua juta tiga ratus ribu`.
- Bilangan lebih besar dari `Number.MAX_SAFE_INTEGER`, nominal negatif, dan pecahan Rupiah tanpa satuan (mis. `1,5`) ditolak.

### `generateDocumentNumber(options)`
- Wajib `sequence` bilangan bulat positif. `date` default `Date` saat ini dalam kalender WIB atau bisa string `YYYY-MM-DD`.
- Pola default: `{prefix}/{yyyy}/{MM}/{seq}` dengan *padding* nomor urut 4 digit.
- Variabel pola: `{prefix}`, `{suffix}`, `{yyyy}`, `{yy}`, `{MM}`, `{dd}`, `{romanMonth}`, `{seq}`.
- **Sequence harus dikelola aplikasi/database** (idealnya sequence transaksional). Fungsi ini tidak menjamin nomor unik secara global.

### `cleanPhone(input)`
- Menangani `08...`, `628...`, `+628...`, `8...`, dan URL `wa.me`.
- Hanya normalisasi **nomor seluler Indonesia** dengan pemeriksaan pola dan panjang; bukan pemeriksaan nomor aktif atau terdaftar WhatsApp.

### `maskSensitive(text, options?)`
- Mengenali pola yang **berlabel** (`NIK:`, `NPWP:`, `WA:`, `rekening:`) untuk mengurangi false positive pada nomor umum.
- Hanya menyamarkan bagian angka dari teks yang cocok. Tidak mendeteksi seluruh PII tanpa label dan **tidak** menggantikan perlindungan keamanan data.
- `maskDigits('1234-5678-90', 2)` menghasilkan `****-****-90`.

### `parseOrder(text)` dan `parseOrders(texts)`
- Menggunakan snapshot kode IndoOrderParser v0.1.0 yang sudah dibuat sebelumnya, disalin untuk memudahkan penggunaan **tanpa dependensi runtime tambahan**.
- Struktur kembalian: `customer`, `items`, `payment`, `note`, `currency`, `itemsSubtotal`, `declaredTotal`, `warnings`, `unparsedSegments`.
- Parser bekerja secara heuristik (bukan AI). Untuk checkout/pembayaran, validasi manual tetap diperlukan.
- Snapshot ini tidak otomatis ikut berubah saat IndoOrderParser independen diperbarui.

## Struktur proyek

```text
indo-toolkit/
├── src/                 # Implementasi modul CommonJS
├── esm/                 # Ekspor ES Modules per modul
├── types/               # Deklarasi TypeScript untuk subpath
├── test/                # Pengujian node:test
├── examples/            # Contoh perintah npm run example
├── .github/workflows/   # GitHub Actions untuk Node 18/20/22
├── index.cjs
├── index.mjs
├── index.d.ts
├── package.json
├── README.md
├── LICENSE
└── THIRD_PARTY_NOTICES.md
```

## Untuk maintainer: sebelum publikasi

1. Jalankan `npm test`, `npm run example`, `npm pack --dry-run`.
2. Tinjau `package.json`, terutama nama paket. Cek dengan `npm view indo-toolkit version`; `E404` **bukan jaminan eksklusif** nama tersedia.
3. Buat repositori GitHub terpisah untuk IndoToolkit; tidak perlu mengubah repositori IndoOrderParser.
4. Jika nama `indo-toolkit` tersedia untuk akunmu, login `npm login` lalu terbitkan dengan `npm publish --access public`; jika tidak, ganti `name` ke nama lain atau scope `@username/indo-toolkit`.
5. Uji instalasi dari registry setelah npm memastikan publikasi berhasil.

## Lisensi

MIT. Lihat `LICENSE` dan `THIRD_PARTY_NOTICES.md`. Penggunaan pada data pelanggan/keuangan harus mempertimbangkan izin, privasi, dan validasi input.
