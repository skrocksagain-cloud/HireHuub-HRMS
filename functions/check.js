const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'skrocksagain-cloud' }); // Assuming it connects to the local emulator or remote db with credentials
const db = admin.firestore();

async function run() {
  const empIds = ['HH0005', 'HH0008', 'HH0016', 'HH0017', 'HH0018', 'HH0019'];
  for (const empId of empIds) {
    const snapshot = await db.collection('employees').where('employeeId', '==', empId).get();
    if (snapshot.empty) {
      console.log(empId, 'Not found');
    } else {
      const data = snapshot.docs[0].data();
      console.log(empId, {
        firebaseUid: data.firebaseUid,
        department: data.department,
        departmentId: data.departmentId,
        assignedRole: data.assignedRole,
        role: data.role,
        reportingManagerId: data.reportingManagerId,
        reportingManager: data.reportingManager
      });
    }
  }
}
run().catch(console.error);
