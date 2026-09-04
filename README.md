# Backend Sagatama-513 — Pi Network payments & SGT ledger

Empat endpoint yang dipanggil dari `index.html` Anda:

| Endpoint | Dipanggil dari | Fungsi |
|---|---|---|
| `POST /api/payments/approve` | `onReadyForServerApproval` | Menyetujui pembayaran Pi ke Pi Platform API |
| `POST /api/payments/complete` | `onReadyForServerComplete` | Menyelesaikan pembayaran setelah txid diterima |
| `POST /api/sgt/balance` | `loadSgtBalanceFromLedger` | Ambil saldo SGT user dari Firestore |
| `POST /api/sgt/sync` | `syncSgtDelta513` | Menambah saldo SGT user setelah pembelian |

## 1. Setup

```bash
npm install
```

## 2. Environment variables

Salin `.env.example` ke `.env` (untuk local dev) lalu isi:

- **`PI_API_KEY`** — dari [Pi Developer Portal](https://develop.pi), buka app Anda → *API Key*. **Jangan pernah** ditaruh di kode frontend, hanya di server.
- **`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`** (atau `FIREBASE_SERVICE_ACCOUNT_JSON`) — dari Firebase Console → Project settings → Service accounts → *Generate new private key*, project **portal-sagatama** (sama dengan yang dipakai frontend).
- **`ALLOWED_ORIGINS`** — domain tempat `index.html` / `sagatama-513.html` di-hosting.

Kalau di-deploy ke Vercel, isi variabel-variabel ini lewat **Project Settings → Environment Variables**, bukan commit file `.env` ke repo.

## 3. Deploy

Struktur folder `api/` ini sudah mengikuti konvensi Vercel Serverless Functions. Cara termudah:

- **Gabungkan ke repo backend yang sudah ada** (`sagatama-mart.vercel.app`): salin folder `api/payments/`, `api/sgt/`, dan `lib/` ke repo itu, gabungkan `package.json` dependency-nya, lalu deploy seperti biasa. Karena `SAGATAMA_API` di frontend sudah menunjuk ke domain itu, tidak perlu ubah apa pun di `index.html`.
- **Atau deploy sebagai project Vercel terpisah**: `vercel deploy`, lalu ubah `SAGATAMA_API` di frontend ke domain baru tersebut.

## 4. Catatan keamanan (penting)

1. **`/api/sgt/sync` mempercayai `delta` yang dikirim frontend.** Saya sudah tambahkan:
   - Verifikasi `accessToken` ke Pi (`/v2/me`) supaya `uid` tidak bisa dipalsukan.
   - Idempotency lewat `txId` (dipakai sebagai ID dokumen), jadi sync yang sama tidak bisa dikreditkan dua kali.
   - Batas sanity `MAX_DELTA_PER_SYNC` (100.000) per sekali panggil.

   Ini **belum** memverifikasi bahwa `delta` benar-benar sesuai jumlah Pi yang benar-benar dibayar — client masih bisa mengirim delta yang di-inflate (dalam batas cap) karena `estimateSgtReward513()` dihitung di browser. Kalau SGT ini punya nilai tukar nyata (bisa dijual/ditukar), rekomendasi saya: ubah `sagatama513Checkout` supaya mengirim `paymentId` (bukan `delta` mentah) ke `/api/sgt/sync`, lalu backend memanggil `piGetPayment(paymentId)` untuk mengambil jumlah Pi yang benar-benar dibayar dan menghitung reward-nya sendiri di server. Saya bisa buatkan versi itu kalau Anda mau — perlu sedikit ubahan di frontend juga.

2. **Password admin Firebase di `index.html` (baris ~1472) tertanam di client-side**, hanya disamarkan lewat char-code. Ini bisa dibaca siapa pun lewat "View Source". Dengan backend ini sudah berjalan, sebaiknya operasi admin (ubah `mintRate`, distribusi manual SGT) juga dipindah ke endpoint server yang diproteksi (misalnya dengan API key admin terpisah), bukan login Firebase langsung dari browser. Beri tahu saya kalau mau saya buatkan endpoint `/api/admin/*` untuk ini.

3. Pastikan **Firestore Security Rules** untuk collection `users` dan `sgt_logs` melarang tulis langsung dari client (`allow write: if false;` di rules, kecuali lewat Admin SDK di server ini) — supaya semua perubahan saldo SGT hanya bisa lewat backend yang sudah memverifikasi.
