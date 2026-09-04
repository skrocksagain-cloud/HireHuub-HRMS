"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.completePasswordReset = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
exports.completePasswordReset = functions.https.onCall(async (request) => {
    const { employeeId, otp, newPassword } = request.data;
    if (!employeeId || !otp || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters.');
    }
    const cleanId = employeeId.trim();
    const db = admin.firestore();
    try {
        // 1. Resolve employee document ID
        let employeeDocId = cleanId;
        let employeeData = null;
        let docRef = db.collection('employees').doc(cleanId);
        let docSnap = await docRef.get();
        if (docSnap.exists) {
            employeeData = docSnap.data();
        }
        else {
            const snapshot = await db.collection('employees').where('employeeId', '==', cleanId).limit(1).get();
            if (!snapshot.empty) {
                employeeDocId = snapshot.docs[0].id;
                employeeData = snapshot.docs[0].data();
            }
        }
        if (!employeeData) {
            throw new functions.https.HttpsError('not-found', 'Invalid reset code or employee.');
        }
        // 2. Verify OTP
        const tokenRef = db.collection('passwordResetTokens').doc(employeeDocId);
        const tokenSnap = await tokenRef.get();
        if (!tokenSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Invalid or expired reset code.');
        }
        const tokenData = tokenSnap.data();
        if (tokenData.consumed) {
            throw new functions.https.HttpsError('failed-precondition', 'Reset code has already been used.');
        }
        if (tokenData.expiresAt.toDate().getTime() < Date.now()) {
            throw new functions.https.HttpsError('failed-precondition', 'Reset code has expired.');
        }
        if (tokenData.attempts >= 5) {
            throw new functions.https.HttpsError('resource-exhausted', 'Too many failed attempts. Request a new code.');
        }
        const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
        if (inputHash !== tokenData.otpHash) {
            await tokenRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
            throw new functions.https.HttpsError('invalid-argument', 'Invalid reset code.');
        }
        // Mark consumed
        await tokenRef.update({ consumed: true });
        // 3. Resolve canonical Firebase UID
        let uid = employeeData.firebaseUid;
        if (!uid) {
            // Fallback: Resolve canonical auth identity if UID isn't in Firestore
            const canonicalEmail = `${(employeeData.employeeId || employeeDocId).toLowerCase()}@hirehuub.local`;
            try {
                const userRecord = await admin.auth().getUserByEmail(canonicalEmail);
                uid = userRecord.uid;
                // Optionally update Firestore with the discovered UID
                await db.collection('employees').doc(employeeDocId).update({ firebaseUid: uid });
            }
            catch (authErr) {
                if (authErr.code === 'auth/user-not-found') {
                    throw new functions.https.HttpsError('not-found', 'Auth account not found. Please contact an Administrator.');
                }
                throw authErr;
            }
        }
        // 4. Reset Password via Admin SDK
        await admin.auth().updateUser(uid, { password: newPassword });
        // 5. Clear Lockout and Login fields
        await db.collection('employees').doc(employeeDocId).update({
            passwordHash: null,
            tempPasswordHash: null,
            failedLoginAttempts: 0,
            lockedUntil: null,
            lockReason: null,
            accountStatus: 'Active',
            lastPasswordChangedAt: new Date().toISOString()
        });
        return { success: true };
    }
    catch (err) {
        console.error('Error in completePasswordReset:', err);
        if (err instanceof functions.https.HttpsError) {
            throw err;
        }
        throw new functions.https.HttpsError('internal', 'An internal error occurred while resetting the password.');
    }
});
//# sourceMappingURL=completePasswordReset.js.map