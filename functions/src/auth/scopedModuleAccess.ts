import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, type DocumentData, type QueryDocumentSnapshot, type QuerySnapshot } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

if (getApps().length === 0) {
  initializeApp();
}
const db = getFirestore();
export type CanonicalRole = 'Super Admin' | 'Master Admin' | 'Admin' | 'User';
type ScopedRecord = { id: string } & Record<string, unknown>;
export interface EmployeeAccessContext {
  employeeId: string;
  role: CanonicalRole;
  departmentId: string;
  department: string;
  reportingManagerId: string;
}
interface AttendanceDashboardPayload { month: string; today: string; targetEmployeeId?: string }
interface DecisionPayload { requestId: string; decision: 'Approved' | 'Rejected'; reason: string }
interface LeaveSyncPayload { leaveRequestId: string }

const roleRank: Record<CanonicalRole, number> = { User: 1, Admin: 2, 'Master Admin': 3, 'Super Admin': 4 };
export const text = (value: unknown): string => typeof value === 'string' ? value : '';
const canonicalRole = (value: unknown): CanonicalRole => {
  const role = text(value).trim().toLowerCase();
  if (role === 'super admin' || role === 'super_admin') return 'Super Admin';
  if (role === 'master admin' || role === 'master_admin') return 'Master Admin';
  if (role === 'admin') return 'Admin';
  return 'User';
};
export const employeeRole = (data: DocumentData): CanonicalRole => canonicalRole(data.assignedRole || data.role);
export const serializeFirestoreData = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value !== 'object') {
    return value;
  }
  if ('toDate' in value && typeof (value as any).toDate === 'function') {
    return ((value as any).toDate() as Date).toISOString();
  }
  if ('path' in value && typeof (value as any).get === 'function') {
    return (value as any).path;
  }
  if (Array.isArray(value)) {
    return value.map(serializeFirestoreData);
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    result[k] = serializeFirestoreData(v);
  }
  return result;
};

export const toRecord = (snapshot: QueryDocumentSnapshot<DocumentData>): ScopedRecord => {
  const data = snapshot.data();
  const serialized = serializeFirestoreData(data) as Record<string, unknown>;
  return { ...serialized, id: snapshot.id } as ScopedRecord;
};

export async function getActor(uid: string): Promise<EmployeeAccessContext> {
  const snapshot = await db.collection('employees').where('firebaseUid', '==', uid).limit(1).get();
  if (snapshot.empty) throw new HttpsError('permission-denied', 'No employee profile is linked to this Firebase user.');
  const profile = snapshot.docs[0].data();
  const accountStatus = text(profile.accountStatus || 'Active');
  const employmentStatus = text(profile.employmentStatus || profile.status || 'Active');
  if (!['Active', 'Pending Activation'].includes(accountStatus) || !['Active', 'Notice Period', 'Pending Activation'].includes(employmentStatus)) {
    throw new HttpsError('permission-denied', 'The employee profile is inactive.');
  }
  const employeeId = text(profile.employeeId);
  if (!employeeId) throw new HttpsError('failed-precondition', 'The employee profile has no employeeId.');
  return {
    employeeId,
    role: employeeRole(profile),
    departmentId: text(profile.departmentId),
    department: text(profile.department),
    reportingManagerId: text(profile.reportingManagerId),
  };
}

async function getEmployee(employeeId: string): Promise<DocumentData> {
  const result = await db.collection('employees').where('employeeId', '==', employeeId).limit(1).get();
  if (result.empty) throw new HttpsError('not-found', 'Employee profile was not found.');
  return result.docs[0].data();
}

function sameDepartment(actor: EmployeeAccessContext, target: DocumentData): boolean {
  const targetId = text(target.departmentId);
  const targetName = text(target.department);
  if (actor.departmentId && targetId) return actor.departmentId === targetId;
  return Boolean(actor.department && targetName && actor.department.toLowerCase() === targetName.toLowerCase());
}

function canAccessEmployee(actor: EmployeeAccessContext, target: DocumentData): boolean {
  const targetId = text(target.employeeId);
  if (actor.role === 'Super Admin') return true;
  if (targetId === actor.employeeId) return true;
  if (actor.role === 'Master Admin') return sameDepartment(actor, target);
  if (actor.role === 'Admin') return text(target.reportingManagerId) === actor.employeeId;
  return false;
}

export async function getScopedEmployeeIds(actor: EmployeeAccessContext): Promise<string[]> {
  if (actor.role === 'Super Admin') {
    const result = await db.collection('employees').get();
    return result.docs.map((doc) => text(doc.data().employeeId)).filter(Boolean);
  }
  if (actor.role === 'Master Admin') {
    const [byId, byName] = await Promise.all([
      actor.departmentId ? db.collection('employees').where('departmentId', '==', actor.departmentId).get() : Promise.resolve(null),
      actor.department ? db.collection('employees').where('department', '==', actor.department).get() : Promise.resolve(null),
    ]);
    const ids = new Set<string>([actor.employeeId]);
    byId?.docs.forEach((doc) => { const id = text(doc.data().employeeId); if (id) ids.add(id); });
    byName?.docs.forEach((doc) => { const id = text(doc.data().employeeId); if (id) ids.add(id); });
    return [...ids];
  }
  if (actor.role === 'Admin') {
    const reports = await db.collection('employees').where('reportingManagerId', '==', actor.employeeId).get();
    const ids = new Set<string>([actor.employeeId]);
    reports.docs.forEach((doc) => { const id = text(doc.data().employeeId); if (id) ids.add(id); });
    return [...ids];
  }
  return [actor.employeeId];
}

async function getScopedRecords(collectionName: string, ids: string[], isGlobal: boolean): Promise<ScopedRecord[]> {
  if (isGlobal) return (await db.collection(collectionName).get()).docs.map(toRecord);
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += 30) chunks.push(uniqueIds.slice(index, index + 30));
  const snapshots = await Promise.all(chunks.map((chunk) =>
    db.collection(collectionName).where('employeeId', 'in', chunk).get()
  ));
  const records = new Map<string, ScopedRecord>();
  snapshots.forEach((snapshot) => snapshot.docs.forEach((doc) => records.set(doc.id, toRecord(doc))));
  return [...records.values()];
}

export const getScopedAttendanceDashboard = onCall<AttendanceDashboardPayload>({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to read attendance data.');
  const { month, today } = request.data;
  const targetEmployeeId = text(request.data.targetEmployeeId);
  if (!/^\d{4}-\d{2}$/.test(month) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    throw new HttpsError('invalid-argument', 'A valid month and attendance date are required.');
  }
  try {
    const actor = await getActor(request.auth.uid);
    const targetId = targetEmployeeId || actor.employeeId;
    const target = await getEmployee(targetId);
    if (!canAccessEmployee(actor, target)) throw new HttpsError('permission-denied', 'The target employee is outside your reporting scope.');
    const ids = await getScopedEmployeeIds(actor);
    const global = actor.role === 'Super Admin';
    const [allAttendance, allLeaves] = await Promise.all([
      getScopedRecords('attendance', ids, global),
      getScopedRecords('leaveRequests', ids, global),
    ]);
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    const start = month + '-01';
    const end = month + '-' + String(lastDay).padStart(2, '0');
    const daily = allAttendance.filter((item) => item.documentType === 'daily' && text(item.attendanceDate) >= start && text(item.attendanceDate) <= end);
    const requests = allAttendance.filter((item) => item.documentType === 'request' && item.status === 'Pending');
    const approvedLeaves = allLeaves.filter((item) => item.status === 'Approved' && text(item.startDate) <= end && text(item.endDate) >= start);
    return {
      today: daily.find((item) => item.employeeId === targetId && item.attendanceDate === today) || null,
      monthRecords: daily.filter((item) => item.employeeId === targetId),
      requests,
      organizationRecords: daily,
      approvedLeaves,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'getScopedAttendanceDashboard failed: ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const getScopedAttendanceEmployees = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to read the Attendance employee selector.');
  try {
    const actor = await getActor(request.auth.uid);
    const ids = await getScopedEmployeeIds(actor);
    if (ids.length === 0) return { employees: [] };
    const chunks: string[][] = [];
    for (let index = 0; index < ids.length; index += 30) chunks.push(ids.slice(index, index + 30));
    const snapshots = await Promise.all(chunks.map((chunk) => db.collection('employees').where('employeeId', 'in', chunk).get()));
    const employees = snapshots.flatMap((snapshot) => snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id, employeeId: text(data.employeeId), employeeCode: text(data.employeeCode),
        firstName: text(data.firstName), lastName: text(data.lastName), fullName: text(data.fullName),
        department: text(data.department), departmentId: text(data.departmentId),
        reportingManagerId: text(data.reportingManagerId), employmentStatus: text(data.employmentStatus || data.status), birthdayMonthDay: text(data.dateOfBirth).slice(5, 10),
      };
    }));
    return { employees };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'getScopedAttendanceEmployees failed: ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const getScopedLeaveRequests = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to read leave requests.');
  try {
    const actor = await getActor(request.auth.uid);
    const ids = await getScopedEmployeeIds(actor);
    const records = await getScopedRecords('leaveRequests', ids, actor.role === 'Super Admin');
    const ownRequests = records.filter((item) => item.employeeId === actor.employeeId);
    return { ownRequests, organizationRequests: records };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'getScopedLeaveRequests failed: ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const decideAttendanceRequest = onCall<DecisionPayload>({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to decide attendance requests.');
  const requestId = text(request.data.requestId);
  const reason = text(request.data.reason).trim();
  const decision = request.data.decision;
  if (!requestId || !['Approved', 'Rejected'].includes(decision) || !reason) throw new HttpsError('invalid-argument', 'A request, decision, and reason are required.');
  try {
    const actor = await getActor(request.auth.uid);
    const requestRef = db.collection('attendance').doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists) throw new HttpsError('not-found', 'Attendance request was not found.');
    const attendanceRequest = requestSnap.data() || {};
    if (attendanceRequest.documentType !== 'request' || attendanceRequest.status !== 'Pending') {
      throw new HttpsError('failed-precondition', 'Only a pending Attendance request can be decided.');
    }
    const targetId = text(attendanceRequest.employeeId);
    const target = await getEmployee(targetId);
    if (!canAccessEmployee(actor, target)) throw new HttpsError('permission-denied', 'The request is outside your reporting scope.');
    if (targetId === actor.employeeId) throw new HttpsError('permission-denied', 'You cannot approve your own request.');
    if (roleRank[actor.role] < roleRank[employeeRole(target)]) throw new HttpsError('permission-denied', 'Insufficient role authority for this request.');
    const isManager = text(target.reportingManagerId) === actor.employeeId;
    const result = await db.runTransaction(async (transaction) => {
      const current = await transaction.get(requestRef);
      if (!current.exists || current.data()?.documentType !== 'request' || current.data()?.status !== 'Pending') {
        throw new HttpsError('failed-precondition', 'This Attendance request is no longer pending.');
      }
      const currentData = current.data() || {};
      if (text(currentData.employeeId) !== targetId) throw new HttpsError('failed-precondition', 'The Attendance request changed while it was being reviewed.');
      const stage = text(currentData.approvalStage) || 'Pending';
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString(), decisionReason: reason };
      let finalStatus: 'Pending' | 'Approved' | 'Rejected';
      let newStage: string;
      let targetStatus: 'Present' | 'WFH' | null = null;
      let dailySnapshot: QuerySnapshot<DocumentData> | null = null;
      if (decision === 'Rejected') {
        if (!isManager && roleRank[actor.role] < roleRank['Master Admin']) throw new HttpsError('permission-denied', 'Only the reporting manager or Master Admin and above can reject this request.');
        finalStatus = 'Rejected';
        newStage = 'Rejected';
        Object.assign(update, { status: finalStatus, approvalStage: newStage, approverEmployeeId: actor.employeeId });
      } else if (stage === 'Pending' || stage === 'Pending Manager Approval') {
        if (text(target.reportingManagerId) && !isManager) throw new HttpsError('permission-denied', 'Stage 1 approval is reserved for the direct reporting manager.');
        if (!text(target.reportingManagerId) && roleRank[actor.role] < roleRank['Master Admin']) throw new HttpsError('permission-denied', 'Master Admin or Super Admin approval is required when no manager is assigned.');
        finalStatus = 'Pending';
        newStage = 'Approved by Manager';
        Object.assign(update, { status: finalStatus, approvalStage: newStage, managerApproved: true, managerApproverId: actor.employeeId });
      } else if (stage === 'Approved by Manager') {
        if (roleRank[actor.role] < roleRank['Master Admin']) throw new HttpsError('permission-denied', 'Final approval requires Master Admin or Super Admin.');
        finalStatus = 'Approved';
        newStage = 'Fully Approved';
        targetStatus = currentData.requestType === 'WFH' ? 'WFH' : 'Present';
        Object.assign(update, { status: finalStatus, approvalStage: newStage, adminApproved: true, adminApproverId: actor.employeeId, approverEmployeeId: actor.employeeId });
        const attendanceDate = text(currentData.attendanceDate);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) throw new HttpsError('failed-precondition', 'Attendance request has an invalid date.');
        dailySnapshot = await transaction.get(db.collection('attendance').where('documentType', '==', 'daily').where('employeeId', '==', targetId).where('attendanceDate', '==', attendanceDate).limit(1));
      } else {
        throw new HttpsError('failed-precondition', 'This attendance request is already complete.');
      }
      transaction.update(requestRef, update);
      if (dailySnapshot && targetStatus) {
        const attendanceDate = text(currentData.attendanceDate);
        const dailyPayload = { documentType: 'daily', employeeId: targetId, employeeName: text(currentData.employeeName), department: text(currentData.department), attendanceDate, status: targetStatus, isLocked: false, updatedAt: new Date().toISOString() };
        if (dailySnapshot.empty) transaction.create(db.collection('attendance').doc(), { ...dailyPayload, createdAt: new Date().toISOString() });
        else transaction.update(dailySnapshot.docs[0].ref, { status: targetStatus, updatedAt: new Date().toISOString() });
      }
      return { status: finalStatus, approvalStage: newStage, targetStatus, employeeId: targetId, employeeName: text(currentData.employeeName), requestType: currentData.requestType === 'WFH' ? 'WFH' as const : 'Regularization' as const, attendanceDate: text(currentData.attendanceDate) };
    });
    if (result.status === 'Approved' && result.targetStatus === 'Present') await grantCompOffForWorkedDay(targetId, result.attendanceDate, true);
    return result;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'decideAttendanceRequest failed for attendance/' + requestId + ': ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const decideLeaveRequest = onCall<DecisionPayload>({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to decide leave requests.');
  const requestId = text(request.data.requestId);
  const reason = text(request.data.reason).trim();
  const decision = request.data.decision;
  if (!requestId || !['Approved', 'Rejected'].includes(decision) || !reason) throw new HttpsError('invalid-argument', 'A request, decision, and reason are required.');
  try {
    const actor = await getActor(request.auth.uid);
    const requestRef = db.collection('leaveRequests').doc(requestId);
    const requestSnap = await requestRef.get();
    if (!requestSnap.exists || requestSnap.data()?.status !== 'Pending') throw new HttpsError('failed-precondition', 'This leave request is no longer pending.');
    const leaveRequest = requestSnap.data() || {};
    const targetId = text(leaveRequest.employeeId);
    const target = await getEmployee(targetId);
    if (!canAccessEmployee(actor, target)) throw new HttpsError('permission-denied', 'The request is outside your reporting scope.');
    if (targetId === actor.employeeId) throw new HttpsError('permission-denied', 'You cannot approve your own request.');
    if (roleRank[actor.role] < roleRank[employeeRole(target)]) throw new HttpsError('permission-denied', 'Insufficient role authority for this request.');
    const managerId = text(target.reportingManagerId);
    if (managerId && managerId !== actor.employeeId && roleRank[actor.role] < roleRank['Master Admin']) {
      throw new HttpsError('permission-denied', 'Leave approval must be performed by the direct reporting manager or escalated to Master Admin or Super Admin.');
    }
    if (!managerId) {
      const targetRole = employeeRole(target);
      const minimumRole: CanonicalRole = targetRole === 'Master Admin' ? 'Super Admin' : 'Master Admin';
      if (roleRank[actor.role] < roleRank[minimumRole]) throw new HttpsError('permission-denied', 'Escalated leave approval requires ' + minimumRole + ' or above.');
    }
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(requestRef);
      if (!current.exists || current.data()?.status !== 'Pending') throw new HttpsError('failed-precondition', 'This leave request is no longer pending.');
      const balanceQuery = db.collection('leaveBalances').where('employeeId', '==', targetId).where('leaveType', '==', text(leaveRequest.leaveType));
      const balances = decision === 'Approved' ? await transaction.get(balanceQuery) : null;
      transaction.update(requestRef, { status: decision, approverEmployeeId: actor.employeeId, decisionReason: reason, updatedAt: new Date().toISOString() });
      if (balances) {
        for (const balance of balances.docs) {
          const data = balance.data();
          const days = Number(leaveRequest.days || 0);
          transaction.update(balance.ref, { used: Number(data.used || 0) + days, available: Math.max(0, Number(data.available || 0) - days), updatedAt: new Date().toISOString() });
        }
      }
    });
    return { employeeId: targetId, employeeName: text(leaveRequest.employeeName), department: text(leaveRequest.department), startDate: text(leaveRequest.startDate), endDate: text(leaveRequest.endDate), days: Number(leaveRequest.days || 0), status: decision };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'decideLeaveRequest failed for leaveRequests/' + requestId + ': ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

async function grantCompOffForWorkedDay(employeeId: string, attendanceDate: string, approvedCorrection = false): Promise<boolean> {
  const [year, month, day] = attendanceDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isSunday = date.getUTCDay() === 0;
  const holiday = await db.collection('admin_holidays').where('date', '==', attendanceDate).limit(1).get();
  if (!isSunday && holiday.empty) return false;
  const attendance = await db.collection('attendance').where('documentType', '==', 'daily').where('employeeId', '==', employeeId).where('attendanceDate', '==', attendanceDate).limit(1).get();
  if (attendance.empty) return false;
  const attendanceData = attendance.docs[0].data();
  const status = text(attendanceData.status);
  const completedDay = Boolean(attendanceData.logoutTime) && Number(attendanceData.totalWorkMinutes || 0) > 0;
  if (!['Present', 'Late', 'Half Day'].includes(status) && !(status === 'Week Off' && completedDay) && !approvedCorrection) return false;
  const leaveQuery = db.collection('leaveRequests').where('employeeId', '==', employeeId).where('startDate', '==', attendanceDate).where('requestType', '==', 'Comp Off');
  const balanceQuery = db.collection('leaveBalances').where('employeeId', '==', employeeId).where('leaveType', '==', 'Comp Off');
  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(leaveQuery);
    if (!existing.empty) return false;
    const balances = await transaction.get(balanceQuery);
    const record = attendance.docs[0].data();
    const requestRef = db.collection('leaveRequests').doc();
    transaction.create(requestRef, {
      employeeId, employeeName: text(record.employeeName), department: text(record.department), requestType: 'Comp Off',
      leaveType: 'Comp Off Earned', startDate: attendanceDate, endDate: attendanceDate, days: 1,
      reason: holiday.empty ? 'Worked on Week Off - Sunday (' + attendanceDate + ')' : 'Worked on Holiday (' + attendanceDate + ')',
      medicalCertificateReference: '', status: 'Approved', approverEmployeeId: 'System (Attendance Engine)',
      decisionReason: 'Earned by working on Holiday / Sunday', isArchived: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    if (balances.empty) {
      transaction.create(db.collection('leaveBalances').doc(), { employeeId, leaveType: 'Comp Off', available: 1, credited: 1, carriedForward: 0, used: 0, updatedAt: new Date().toISOString() });
    } else {
      const balance = balances.docs[0];
      const data = balance.data();
      transaction.update(balance.ref, { available: Number(data.available || 0) + 1, credited: Number(data.credited || 0) + 1, updatedAt: new Date().toISOString() });
    }
    return true;
  });
}

export const grantCompOffIfWorked = onCall<{ attendanceDate: string }>({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to evaluate compensatory leave.');
  const attendanceDate = text(request.data.attendanceDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) throw new HttpsError('invalid-argument', 'A valid attendance date is required.');
  try {
    const actor = await getActor(request.auth.uid);
    return { granted: await grantCompOffForWorkedDay(actor.employeeId, attendanceDate) };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'grantCompOffIfWorked failed for attendance/' + attendanceDate + ': ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const processMonthlyLeaveAccrual = onCall({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to process leave accrual.');
  try {
    const actor = await getActor(request.auth.uid);
    const employee = await getEmployee(actor.employeeId);
    const joiningDate = text(employee.joiningDate);
    const [joinYear, joinMonth, joinDay] = joiningDate.split('-').map(Number);
    const joinDate = new Date(joinYear, joinMonth - 1, joinDay);
    if (!joiningDate || Number.isNaN(joinDate.getTime())) throw new HttpsError('failed-precondition', 'Employee joining date is invalid.');
    const elapsedDays = Math.max(0, Math.floor((Date.now() - joinDate.getTime()) / 86_400_000));
    if (elapsedDays < 90) return { credited: false, reason: 'Monthly leave accrual is not active during the 90-day probation period.' };
    const today = new Date();
    const accrualMonth = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
    const settings = await db.collection('admin_company').doc('hirehuub_company_settings').get();
    const settingsData = settings.data() || {};
    const policy = settingsData.leavePolicy;
    const configuredRate = typeof policy === 'object' && policy !== null ? Number((policy as Record<string, unknown>).monthlyAccrualDays) : 1.5;
    const amount = Number.isFinite(configuredRate) && configuredRate > 0 && configuredRate <= 31 ? configuredRate : 1.5;
    const leaveType = 'Casual Leave';
    const logRef = db.collection('leaveAccrualLogs').doc(actor.employeeId + ':' + leaveType + ':' + accrualMonth);
    const balancesQuery = db.collection('leaveBalances').where('employeeId', '==', actor.employeeId).where('leaveType', '==', leaveType);
    const outcome = await db.runTransaction(async (transaction) => {
      const log = await transaction.get(logRef);
      if (log.exists) return false;
      const balances = await transaction.get(balancesQuery);
      if (balances.empty) {
        transaction.create(db.collection('leaveBalances').doc(), { employeeId: actor.employeeId, leaveType, available: amount, credited: amount, carriedForward: 0, used: 0, updatedAt: new Date().toISOString() });
      } else {
        const balance = balances.docs[0];
        const data = balance.data();
        transaction.update(balance.ref, { available: Number(data.available || 0) + amount, credited: Number(data.credited || 0) + amount, updatedAt: new Date().toISOString() });
      }
      transaction.create(logRef, { id: logRef.id, employeeId: actor.employeeId, leaveType, accrualMonth, creditedAmount: amount, createdAt: new Date().toISOString() });
      return true;
    });
    return { credited: outcome, amount: outcome ? amount : undefined, reason: outcome ? 'Monthly leave accrual credited.' : 'Monthly leave accrual has already been credited.' };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'processMonthlyLeaveAccrual failed for leaveBalances: ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

export const syncApprovedLeaveAttendance = onCall<LeaveSyncPayload>({ invoker: 'public' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign-in is required to sync approved leave.');
  const leaveRequestId = text(request.data.leaveRequestId);
  if (!leaveRequestId) throw new HttpsError('invalid-argument', 'An approved leave request ID is required.');
  try {
    const actor = await getActor(request.auth.uid);
    const leaveSnapshot = await db.collection('leaveRequests').doc(leaveRequestId).get();
    const leaveRequest = leaveSnapshot.data() || {};
    const employeeId = text(leaveRequest.employeeId);
    const target = await getEmployee(employeeId);
    if (!leaveSnapshot.exists || leaveRequest.status !== 'Approved' || !canAccessEmployee(actor, target) || employeeId === actor.employeeId) {
      throw new HttpsError('permission-denied', 'Only an approved leave request in your reporting scope can be synchronized.');
    }
    const startDate = text(leaveRequest.startDate);
    const endDate = text(leaveRequest.endDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      throw new HttpsError('failed-precondition', 'The approved leave request has invalid dates.');
    }
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');
    const count = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (count < 1 || count > 62) throw new HttpsError('failed-precondition', 'The approved leave date range is invalid or too long.');
    for (let index = 0; index < count; index += 1) {
      const date = new Date(start.getTime() + index * 86_400_000);
      const attendanceDate = date.toISOString().slice(0, 10);
      const existing = await db.collection('attendance').where('documentType', '==', 'daily').where('employeeId', '==', employeeId).where('attendanceDate', '==', attendanceDate).limit(1).get();
      const payload = { documentType: 'daily', employeeId, employeeName: text(leaveRequest.employeeName), department: text(leaveRequest.department), attendanceDate, status: 'Leave', isLocked: false, updatedAt: new Date().toISOString() };
      if (existing.empty) await db.collection('attendance').add({ ...payload, createdAt: new Date().toISOString() });
      else await existing.docs[0].ref.update({ status: 'Leave', updatedAt: new Date().toISOString() });
    }
    return { success: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'syncApprovedLeaveAttendance failed for leaveRequests/' + leaveRequestId + ': ' + (error instanceof Error ? error.message : 'unknown error'));
  }
});

