import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const requestPasswordReset = functions.https.onCall({ invoker: 'public' }, async (request) => {
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
    } else {
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

  } catch (err) {
    console.error('Error in requestPasswordReset:', err);
    throw new functions.https.HttpsError('internal', 'An internal error occurred.');
  }
});
