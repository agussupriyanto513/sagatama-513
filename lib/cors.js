// Terapkan header CORS. Kalau ALLOWED_ORIGINS diisi di env (dipisah koma),
// hanya origin di daftar itu yang diizinkan. Kalau kosong, semua origin
// diizinkan (longgar — cocok untuk awal development, perketat saat production).
const ALLOWED = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED.length === 0 || (origin && ALLOWED.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // caller harus `return` setelah ini
  }
  return false;
}
