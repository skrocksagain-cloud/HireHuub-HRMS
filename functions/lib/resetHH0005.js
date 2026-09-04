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
exports.resetHH0005 = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.resetHH0005 = functions.https.onRequest(async (req, res) => {
    try {
        const canonicalEmail = 'hh0005@hirehuub.local';
        const oldUid = 'a6g8XUrtqhafS4RTK9EPHD2ku5A2';
        // Delete existing
        try {
            await admin.auth().deleteUser(oldUid);
            console.log('Deleted user by old UID.');
        }
        catch (e) {
            console.log('Old UID delete error:', e.message);
        }
        try {
            const existing = await admin.auth().getUserByEmail(canonicalEmail);
            await admin.auth().deleteUser(existing.uid);
            console.log('Deleted user by canonical email.');
        }
        catch (e) {
            console.log('Canonical email delete error:', e.message);
        }
        // Create new
        const newUser = await admin.auth().createUser({
            email: canonicalEmail,
            password: 'Password@123',
        });
        const newUid = newUser.uid;
        console.log('Created new user with UID:', newUid);
        // Update Firestore
        const db = admin.firestore();
        await db.collection('employees').doc('HH0005').update({
            firebaseUid: newUid,
            firstLoginCompleted: false,
            mustChangePassword: true,
            failedLoginAttempts: 0,
            lockedUntil: null,
            lockReason: null,
            tempPasswordHash: null
        });
        console.log('Updated Firestore for HH0005.');
        res.json({ success: true, newUid });
    }
    catch (err) {
        console.error('Error in resetHH0005:', err);
        res.status(500).json({ error: err.message });
    }
});
//# sourceMappingURL=resetHH0005.js.map