import { onRequest } from 'firebase-functions/v2/https';
import { adminDb } from '../config/firebaseAdmin';

export const ping = onRequest({ cors: true }, async (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    // Test Firestore Admin connectivity
    const testDoc = await adminDb.collection('system_health').doc('ping').get();
    const firestoreStatus = testDoc.exists ? 'connected' : 'active';

    res.status(200).json({
      status: 'ok',
      service: 'HireHuub Cloud Functions Foundation',
      version: '3.0.0',
      timestamp,
      firestoreStatus,
      message: 'Stage 0 Cloud Functions Foundation is operational.',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});
