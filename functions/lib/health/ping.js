"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebaseAdmin_1 = require("../config/firebaseAdmin");
exports.ping = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    try {
        const timestamp = new Date().toISOString();
        // Test Firestore Admin connectivity
        const testDoc = await firebaseAdmin_1.adminDb.collection('system_health').doc('ping').get();
        const firestoreStatus = testDoc.exists ? 'connected' : 'active';
        res.status(200).json({
            status: 'ok',
            service: 'HireHuub Cloud Functions Foundation',
            version: '3.0.0',
            timestamp,
            firestoreStatus,
            message: 'Stage 0 Cloud Functions Foundation is operational.',
        });
    }
    catch (err) {
        res.status(500).json({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
        });
    }
});
//# sourceMappingURL=ping.js.map