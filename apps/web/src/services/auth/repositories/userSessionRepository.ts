import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { UserSession } from '../../../types/auth';

const SESSIONS_COLLECTION = 'user_sessions';

export interface UserSessionRepository {
  createSession(sessionData: Omit<UserSession, 'id'>): Promise<string>;
  terminateActiveSessions(employeeId: string): Promise<number>;
  endSession(sessionId: string, status?: UserSession['sessionStatus']): Promise<void>;
  updateSessionActivity(sessionId: string): Promise<void>;
  getActiveSession(sessionId: string): Promise<UserSession | null>;
}

export class FirestoreUserSessionRepository implements UserSessionRepository {
  async createSession(sessionData: Omit<UserSession, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  }

  async terminateActiveSessions(employeeId: string): Promise<number> {
    const q = query(
      collection(db, SESSIONS_COLLECTION),
      where('employeeId', '==', employeeId),
      where('sessionStatus', '==', 'active')
    );
    const snap = await getDocs(q);

    if (snap.empty) return 0;

    const now = new Date().toISOString();
    let terminatedCount = 0;

    await Promise.all(
      snap.docs.map(async (docSnap) => {
        await updateDoc(doc(db, SESSIONS_COLLECTION, docSnap.id), {
          sessionStatus: 'terminated',
          logoutAt: now,
          updatedAt: serverTimestamp(),
        });
        terminatedCount++;
      })
    );

    return terminatedCount;
  }

  async endSession(sessionId: string, status: UserSession['sessionStatus'] = 'logged_out'): Promise<void> {
    const q = query(collection(db, SESSIONS_COLLECTION), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    const now = new Date().toISOString();

    if (!snap.empty && snap.docs[0]) {
      await updateDoc(doc(db, SESSIONS_COLLECTION, snap.docs[0].id), {
        sessionStatus: status,
        logoutAt: now,
        updatedAt: serverTimestamp(),
      });
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const q = query(collection(db, SESSIONS_COLLECTION), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    const now = new Date().toISOString();

    if (!snap.empty && snap.docs[0]) {
      await updateDoc(doc(db, SESSIONS_COLLECTION, snap.docs[0].id), {
        lastActivity: now,
        updatedAt: serverTimestamp(),
      });
    }
  }

  async getActiveSession(sessionId: string): Promise<UserSession | null> {
    const q = query(collection(db, SESSIONS_COLLECTION), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);

    if (snap.empty || !snap.docs[0]) return null;

    const data = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
      employeeId: typeof data.employeeId === 'string' ? data.employeeId : '',
      userId: typeof data.userId === 'string' ? data.userId : '',
      loginAt: typeof data.loginAt === 'string' ? data.loginAt : '',
      logoutAt: typeof data.logoutAt === 'string' ? data.logoutAt : null,
      lastActivity: typeof data.lastActivity === 'string' ? data.lastActivity : '',
      device: typeof data.device === 'string' ? data.device : 'Desktop',
      browser: typeof data.browser === 'string' ? data.browser : 'Chrome',
      platform: typeof data.platform === 'string' ? data.platform : 'Windows',
      ipAddress: typeof data.ipAddress === 'string' ? data.ipAddress : undefined,
      sessionStatus: (data.sessionStatus as UserSession['sessionStatus']) || 'active',
    };
  }
}

export const userSessionRepository: UserSessionRepository = new FirestoreUserSessionRepository();
