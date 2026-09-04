import { applyCors } from '../../lib/cors.js';
import { getDb } from '../../lib/firebaseAdmin.js';
import { piGetMe } from '../../lib/pi.js';

// Dipanggil dari frontend (loadSgtBalanceFromLedger). accessToken diverifikasi
// langsung ke Pi supaya uid tidak bisa dipalsukan dari browser.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'accessToken wajib diisi' });
  }

  try {
    const me = await piGetMe(accessToken);
    const db = getDb();
    const snap = await db.collection('users').doc(me.uid).get();
    const sgtBalance = snap.exists ? (snap.data().sgtBalance || 0) : 0;
    return res.status(200).json({ success: true, sgtBalance, username: me.username });
  } catch (e) {
    console.error('[api/sgt/balance]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
