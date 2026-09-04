import * as admin from 'firebase-admin';

function getAdminApp(): admin.app.App {
  if (!admin.apps.length) {
    return admin.initializeApp();
  }
  return admin.app();
}

/**
 * Lazy getters for Firebase Admin services to prevent top-level execution timeouts
 * during Cloud Functions analysis & deployment.
 */
export const getAdminDb = (): admin.firestore.Firestore => getAdminApp().firestore();
export const getAdminStorage = (): admin.storage.Storage => getAdminApp().storage();
export const getAdminAuth = (): admin.auth.Auth => getAdminApp().auth();

// Backwards-compatible proxy getters so existing imports `adminDb`, `adminStorage`, `adminAuth` continue working seamlessly.
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const instance = getAdminDb() as unknown as Record<string, unknown>;
    const value = instance[prop as string];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const adminStorage = new Proxy({} as admin.storage.Storage, {
  get(_target, prop) {
    const instance = getAdminStorage() as unknown as Record<string, unknown>;
    const value = instance[prop as string];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export const adminAuth = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const instance = getAdminAuth() as unknown as Record<string, unknown>;
    const value = instance[prop as string];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default admin;
