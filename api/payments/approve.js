import { applyCors } from '../../lib/cors.js';
import { piApprovePayment } from '../../lib/pi.js';

// Dipanggil dari frontend saat onReadyForServerApproval(paymentId).
// Ini WAJIB terjadi di server (bukan browser) karena butuh PI_API_KEY rahasia.
export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { paymentId } = req.body || {};
  if (!paymentId) {
    return res.status(400).json({ success: false, error: 'paymentId wajib diisi' });
  }

  try {
    const data = await piApprovePayment(paymentId);
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('[api/payments/approve]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
