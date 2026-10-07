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
exports.requestPasswordReset = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.requestPasswordReset = functions.https.onCall(async (request) => {
    const { employeeId } = request.data;
    const genericResponse = {
        success: true,
        message: 'Your password reset request has been submitted to the Super Admin.'
    };
    if (!employeeId || typeof employeeId !== 'string') {
        return genericResponse;
    }
    const cleanId = employeeId.trim();
    const db = admin.firestore();
    try {
        // Artificial delay to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        // Resolve employee
        let employeeData = null;
        // Try direct lookup by ID
        let docRef = db.collection('employees').doc(cleanId);
        let docSnap = await docRef.get();
        if (docSnap.exists) {
            employeeData = docSnap.data();
        }
        else {
            // Query by employeeId field
            const snapshot = await db.collection('employees').where('employeeId', '==', cleanId).limit(1).get();
            if (!snapshot.empty) {
                employeeData = snapshot.docs[0].data();
            }
        }
        if (!employeeData) {
            return genericResponse; // Prevent employee enumeration
        }
        const actualEmployeeId = employeeData.employeeId || cleanId;
        const actualName = employeeData.name || employeeData.fullName || 'Unknown';
        // Create the admin request
        const requestRef = db.collection('admin_password_reset_requests').doc();
        await requestRef.set({
            employeeId: actualEmployeeId,
            employeeName: actualName,
            requestedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'Pending',
            requestedBy: actualEmployeeId,
            department: employeeData.department || null,
            role: employeeData.assignedRole || employeeData.role || null
        });
        return genericResponse;
    }
    catch (err) {
        console.error('Error in requestPasswordReset:', err);
        throw new functions.https.HttpsError('internal', 'An internal error occurred.');
    }
});
//# sourceMappingURL=requestPasswordReset.js.map