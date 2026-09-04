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
exports.adminAuth = exports.adminStorage = exports.adminDb = exports.getAdminAuth = exports.getAdminStorage = exports.getAdminDb = void 0;
const admin = __importStar(require("firebase-admin"));
function getAdminApp() {
    if (!admin.apps.length) {
        return admin.initializeApp();
    }
    return admin.app();
}
/**
 * Lazy getters for Firebase Admin services to prevent top-level execution timeouts
 * during Cloud Functions analysis & deployment.
 */
const getAdminDb = () => getAdminApp().firestore();
exports.getAdminDb = getAdminDb;
const getAdminStorage = () => getAdminApp().storage();
exports.getAdminStorage = getAdminStorage;
const getAdminAuth = () => getAdminApp().auth();
exports.getAdminAuth = getAdminAuth;
// Backwards-compatible proxy getters so existing imports `adminDb`, `adminStorage`, `adminAuth` continue working seamlessly.
exports.adminDb = new Proxy({}, {
    get(_target, prop) {
        const instance = (0, exports.getAdminDb)();
        const value = instance[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
});
exports.adminStorage = new Proxy({}, {
    get(_target, prop) {
        const instance = (0, exports.getAdminStorage)();
        const value = instance[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
});
exports.adminAuth = new Proxy({}, {
    get(_target, prop) {
        const instance = (0, exports.getAdminAuth)();
        const value = instance[prop];
        return typeof value === 'function' ? value.bind(instance) : value;
    },
});
exports.default = admin;
//# sourceMappingURL=firebaseAdmin.js.map