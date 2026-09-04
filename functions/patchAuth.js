const fs = require('fs');

const filePath = '../apps/web/src/services/auth/authService.ts';
let code = fs.readFileSync(filePath, 'utf8');

// FIX 1: completeActivation
// Replace email resolver
code = code.replace(
  /const email = employee\.email \|\| \`\$\{employee\.employeeId\.toLowerCase\(\)\}\@hirehuub\.local\`;/g,
  'const email = \`${employee.employeeId.toLowerCase()}@hirehuub.local\`;'
);

// Remove createUserWithEmailAndPassword from completeActivation
const completeActivationBlockOld = `
    try {
      if (firebaseUser) {
        // User signed in via OTP, set password
        await updatePassword(firebaseUser, newPasswordInput);
      } else {
        // Try creating the user first
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, newPasswordInput);
          firebaseUser = cred.user;
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
             // Pre-created! We need to sign in with the temporary password and update it.
             let signCred;
             try {
                signCred = await signInWithEmailAndPassword(auth, email, 'Password@123');
             } catch (fallbackError) {
                signCred = await signInWithEmailAndPassword(auth, email, \`\${employee.employeeId}@123\`);
             }
             await updatePassword(signCred.user, newPasswordInput);
             firebaseUser = signCred.user;
          } else {
             throw e;
          }
        }
      }
    } catch (e: any) {
      throw new Error('Failed to securely update credentials. ' + (e.message || ''));
    }

    const now = new Date().toISOString();
    await authRepository.updateEmployeeAuthData(employee.id, {
`;

const completeActivationBlockNew = `
    try {
      // First-login password change must operate on the EXISTING canonical Firebase Auth account.
      // We cannot create a second Firebase Auth account or fall back to creation here.
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      let signCred;
      try {
        signCred = await signInWithEmailAndPassword(auth, email, 'Password@123');
      } catch (fallbackError) {
        signCred = await signInWithEmailAndPassword(auth, email, \`\${employee.employeeId}@123\`);
      }
      
      await updatePassword(signCred.user, newPasswordInput);
      firebaseUser = signCred.user;
    } catch (e: any) {
      throw new Error('Failed to authenticate with temporary password for setup. If your temporary password was customized, you must sign in normally. ' + (e.message || ''));
    }

    const now = new Date().toISOString();
    
    // Save firebaseUid if we successfully authenticated and retrieved it
    const authDataUpdates: Record<string, any> = {
      passwordHash: null,
      tempPasswordHash: null,
      mobileVerified: true,
      firstLoginCompleted: true,
      activatedAt: now,
      lastPasswordChangedAt: now,
      accountStatus: 'Active',
      failedLoginAttempts: 0,
      lockedUntil: null,
      lockReason: null,
    };
    if (firebaseUser?.uid) {
      authDataUpdates.firebaseUid = firebaseUser.uid;
    }
    
    await authRepository.updateEmployeeAuthData(employee.id, authDataUpdates);
`;

code = code.replace(completeActivationBlockOld, completeActivationBlockNew);


// FIX 2: resetPassword
const resetPasswordBlockOld = `
    try {
      if (firebaseUser) {
        await updatePassword(firebaseUser, newPasswordInput);
      } else {
        await createUserWithEmailAndPassword(auth, email, newPasswordInput);
      }
    } catch (e: any) {
      throw new Error('Failed to securely update credentials. ' + (e.message || ''));
    }

    const now = new Date().toISOString();
`;

const resetPasswordBlockNew = `
    // LIMITATION REPORT: Forgot Password cannot securely reset an Email/Password credential from the Client SDK 
    // without the current password unless we use sendPasswordResetEmail (which goes to a non-existent @hirehuub.local email)
    // or a secure backend Cloud Function using the Admin SDK.
    // Creating a new user here is insecure and breaks the canonical identity.
    throw new Error('Secure password reset requires a backend Admin mechanism. Client SDK cannot reset unknown passwords for existing accounts.');
    
    const now = new Date().toISOString();
`;

code = code.replace(resetPasswordBlockOld, resetPasswordBlockNew);

fs.writeFileSync(filePath, code);
console.log('authService.ts patched successfully');
