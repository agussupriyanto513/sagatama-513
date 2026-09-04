import { FieldValue } from 'firebase-admin/firestore';
import { applyCors } from '../../lib/cors.js';
import { getDb } from '../../lib/firebaseAdmin.js';
import { piGetMe } from '../../lib/pi.js';

// Batas sanity per satu kali sync — sesuaikan dengan skala reward toko Anda.
// Ini pengaman minimal, BUKAN pengganti verifikasi penuh (lihat catatan di README).
const MAX_DELTA_PER_SYNC = 100000;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, delta, txId } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'accessToken wajib diisi' });
  }
  if (!(Number(delta) > 0) || Number(delta) > MAX_DELTA_PER_SYNC) {
    return res.status(400).json({ success: false, error: 'delta tidak valid' });
  }
  if (!txId) {
    return res.status(400).json({ success: false, error: 'txId wajib diisi' });
  }

  try {
    // 1) Pastikan accessToken benar-benar milik user Pi yang sah.
    const me = await piGetMe(accessToken);
    const uid = me.uid;

    const db = getDb();
    const userRef = db.collection('users').doc(uid);
    // txId dipakai sebagai ID dokumen log -> otomatis mencegah kredit dobel
    // kalau frontend memanggil sync lagi (retry, klik ganda, dsb).
    const logRef = db.collection('sgt_logs').doc(String(txId));

    const sgtBalance = await db.runTransaction(async (tx) => {
      const [logSnap, userSnap] = await Promise.all([tx.get(logRef), tx.get(userRef)]);
      const currentBal = userSnap.exists ? (userSnap.data().sgtBalance || 0) : 0;

      if (logSnap.exists) {
        // Sudah pernah disinkronkan sebelumnya — jangan kredit lagi, kembalikan saldo apa adanya.
        return currentBal;
      }

      const updated = currentBal + Number(delta);
      tx.set(
        userRef,
        {
          uid,
          username: me.username || null,
          sgtBalance: updated,
          sgtUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(logRef, {
        uid,
        username: me.username || null,
        amount: Number(delta),
        type: 'purchase_reward',
        txId: String(txId),
        timestamp: FieldValue.serverTimestamp(),
      });
      return updated;
    });

    return res.status(200).json({ success: true, sgtBalance });
  } catch (e) {
    console.error('[api/sgt/sync]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
