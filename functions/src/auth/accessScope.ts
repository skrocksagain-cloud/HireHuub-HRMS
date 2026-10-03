import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getFirestore, type DocumentData } from 'firebase-admin/firestore';
import {
  employeeRole,
  getActor,
  getScopedEmployeeIds,
  text,
  toRecord,
  type EmployeeAccessContext,
} from './scopedModuleAccess';

const db = getFirestore();
const SCOPE_COLLECTION = 'access_scopes';

const contextFromProfile = (profile: DocumentData): EmployeeAccessContext => ({
  employeeId: text(profile.employeeId),
  role: employeeRole(profile),
  departmentId: text(profile.departmentId),
  department: text(profile.department),
  reportingManagerId: text(profile.reportingManagerId),
});

/**
 * Derives the employee IDs a manager may act on from Employee profile +
 * Management Control role + Reporting Manager hierarchy, and stores them in a
 * server-only document that Firestore rules read by the caller's employeeId.
 */
export async function writeAccessScope(actor: EmployeeAccessContext): Promise<void> {
  if (!actor.employeeId) return;
  const ref = db.collection(SCOPE_COLLECTION).doc(actor.employeeId);
  if (actor.role === 'User' || actor.role === 'Super Admin') {
    await ref.delete();
    return;
  }
  const employeeIds = await getScopedEmployeeIds(actor);
  await ref.set({ employeeId: actor.employeeId, role: actor.role, employeeIds, updatedAt: new Date().toISOString() });
}

export const refreshAccessScope = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required.');
  const actor = await getActor(request.auth.uid);
  await writeAccessScope(actor);
  return { success: true };
});

export const rebuildAccessScopesOnEmployeeChange = onDocumentWritten('employees/{employeeDocId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const hierarchyFields = ['reportingManagerId', 'departmentId', 'department', 'role', 'assignedRole', 'employeeId'];
  const changed = !before || !after || hierarchyFields.some((field) => before[field] !== after[field]);
  if (!changed) return;
  const managers = await db.collection('employees').get();
  await Promise.all(managers.docs
    .map((doc) => contextFromProfile(doc.data()))
    .filter((ctx) => ctx.role === 'Admin' || ctx.role === 'Master Admin')
    .map(writeAccessScope));
});

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
};

async function readScoped(uid: string, collectionName: string, field: string) {
  const actor = await getActor(uid);
  if (actor.role === 'Super Admin') {
    return (await db.collection(collectionName).get()).docs.map(toRecord);
  }
  const ids = [...new Set((await getScopedEmployeeIds(actor)).filter(Boolean))];
  const snapshots = await Promise.all(chunk(ids, 30).map((part) =>
    db.collection(collectionName).where(field, 'in', part).get()
  ));
  const records = new Map<string, ReturnType<typeof toRecord>>();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((doc) => records.set(doc.id, toRecord(doc))));
  return [...records.values()];
}

export const rebuildAllAccessScopes = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required.');
  const actor = await getActor(request.auth.uid);
  if (actor.role !== 'Super Admin') throw new HttpsError('permission-denied', 'Only Super Admin can rebuild access scopes.');
  const employees = await db.collection('employees').get();
  const managers = employees.docs.map((doc) => contextFromProfile(doc.data())).filter((ctx) => ctx.role === 'Admin' || ctx.role === 'Master Admin');
  await Promise.all(managers.map((ctx) => writeAccessScope(ctx)));
  return { rebuilt: managers.length };
});

export const getScopedCrmCandidates = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required.');
  return { candidates: await readScoped(request.auth.uid, 'crm_candidates', 'assignedRecruiterId') };
});

export const getScopedWorkforce = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required.');
  return { items: await readScoped(request.auth.uid, 'workforce', 'recruiterId') };
});
