# Panduan GitHub dan npm untuk IndoToolkit

## 1. Uji di komputer sendiri

Buka Git Bash / terminal di folder `indo-toolkit` (berisi `package.json`), lalu:

```bash
node -v
npm test
npm run example
npm pack --dry-run
```

Node.js >=18. Pastikan semua tes lulus. Jangan unggah file `.tgz`, ZIP atau folder `node_modules` ke GitHub.

## 2. Buat repositori GitHub BARU

Buat repositori kosong di GitHub, misalnya `indo-toolkit` (public, jangan membuat README baru). Di folder proyek:

```bash
git init
git add .
git commit -m "Initial release IndoToolkit v1.0.0"
git branch -M main
git remote add origin https://github.com/USERNAME/indo-toolkit.git
git push -u origin main
```

Ganti `USERNAME` sesuai akunmu. Jika ada error identitas, jalankan `git config user.name "NAMA"` dan `git config user.email "EMAIL"`, ulangi `git add .` dan `git commit`, lalu `git push`.

Repo ini terpisah dari IndoOrderParser, yang tidak diubah.

## 3. Periksa ketersediaan nama npm

```bash
npm view indo-toolkit version
```

Nama di registry bisa saja dipakai orang lain. Jika diperlukan, ubah field `name` pada `package.json` menjadi nama lain atau scope npm milikmu (`@username/indo-toolkit`), lalu *commit* perubahan sebelum publikasi.

## 4. Publikasikan ke npm (opsional)

Daftar akun di npmjs.com lalu:

```bash
npm login
npm whoami
npm pack --dry-run
npm publish --access public
```

Ikuti autentikasi/2FA npm bila diminta. Hindari memasukkan token ke kode sumber. Nama dan versi paket harus tersedia dan hak publikasi harus kamu miliki.

Setelah npm mengonfirmasi publikasi, uji dari proyek lain:

```bash
npm install indo-toolkit
```

Jika memakai nama scope, sesuaikan perintah dengan nama package. Publikasi npm TIDAK dilakukan otomatis oleh ZIP ini.
