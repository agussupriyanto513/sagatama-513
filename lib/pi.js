const PI_API_BASE = 'https://api.minepi.com/v2';

function authHeader() {
  const key = process.env.PI_API_KEY;
  if (!key) throw new Error('PI_API_KEY belum diset di environment variables server.');
  return { Authorization: `Key ${key}`, 'Content-Type': 'application/json' };
}

// Server-to-server: konfirmasi ke Pi bahwa kita (app) menyetujui pembayaran ini.
export async function piApprovePayment(paymentId) {
  const r = await fetch(`${PI_API_BASE}/payments/${paymentId}/approve`, {
    method: 'POST',
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Pi approve gagal (${r.status}): ${await r.text()}`);
  return r.json();
}

// Server-to-server: konfirmasi transaksi blockchain (txid) sudah diverifikasi & pesanan selesai.
export async function piCompletePayment(paymentId, txid) {
  const r = await fetch(`${PI_API_BASE}/payments/${paymentId}/complete`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({ txid }),
  });
  if (!r.ok) throw new Error(`Pi complete gagal (${r.status}): ${await r.text()}`);
  return r.json();
}

// Server-to-server: batalkan payment (dipakai saat user membatalkan/menutup sebelum selesai).
export async function piCancelPayment(paymentId) {
  const r = await fetch(`${PI_API_BASE}/payments/${paymentId}/cancel`, {
    method: 'POST',
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Pi cancel gagal (${r.status}): ${await r.text()}`);
  return r.json();
}

// Ambil detail payment dari Pi (dipakai untuk verifikasi jumlah/status sebelum kredit SGT).
export async function piGetPayment(paymentId) {
  const r = await fetch(`${PI_API_BASE}/payments/${paymentId}`, {
    headers: authHeader(),
  });
  if (!r.ok) throw new Error(`Pi get payment gagal (${r.status}): ${await r.text()}`);
  return r.json();
}

// Verifikasi accessToken milik user (dari Pi.authenticate() di frontend) dan ambil identitasnya.
export async function piGetMe(accessToken) {
  const r = await fetch(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) throw new Error(`accessToken Pi tidak valid atau kedaluwarsa (${r.status})`);
  return r.json(); // { uid, username, credentials: { scopes, ... } }
}
