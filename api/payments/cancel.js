import { applyCors } from '../../lib/cors.js';
import { piCancelPayment } from '../../lib/pi.js';

// Dipanggil dari frontend saat user membatalkan/menutup pembayaran sebelum selesai.
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
    const data = await piCancelPayment(paymentId);
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error('[api/payments/cancel]', e.message);
    return res.status(500).json({ success: false, error: e.message });
  }
}
