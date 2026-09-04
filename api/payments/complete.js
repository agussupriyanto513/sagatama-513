import { applyCors } from '../../lib/cors.js';
import { piCompletePayment } from '../../lib/pi.js';

// Dipanggil dari frontend saat onReadyForServerCompletion(paymentId, txid).
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { paymentId, txid } = req.body || {};
  if (!paymentId || !txid) {
    return res.status(400).json({ success: false, error: 'paymentId dan txid wajib diisi' });
  }

  try {
    const data = await piCompletePayment(paymentId, txid);
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('[api/payments/complete]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
