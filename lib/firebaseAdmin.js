import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Dua cara mengisi kredensial service account (pakai salah satu):
// 1) FIREBASE_SERVICE_ACCOUNT_JSON = seluruh isi file JSON service account (di-escape jadi 1 baris)
// 2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY terpisah
function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Private key dari env var biasanya newline-nya ter-escape jadi \n literal — perlu di-unescape.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };
}

export function getDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(getServiceAccount()) });
  }
  return getFirestore();
}
