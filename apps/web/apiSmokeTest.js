import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);
const auth = getAuth(app);

// Simulated "AuthService" logic for testing
async function mockAuthServiceLogin(identifier, passwordInput) {
    const docRef = doc(db, 'employees', identifier);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Account not found');
    const employee = snap.data();

    if (employee.accountStatus === 'Inactive') {
        throw new Error(`Account status is '${employee.accountStatus}'. Login access is restricted.`);
    }

    if (employee.accountStatus === 'Pending Activation' || !employee.firstLoginCompleted) {
        const isPasswordValid = passwordInput === 'Password@123' || passwordInput === `${identifier}@123`;
        if (!isPasswordValid) throw new Error('Invalid temporary password.');
        return { success: true, mustChangePassword: true, role: employee.role };
    }

    // Normal login
    const email = employee.email;
    try {
        await signInWithEmailAndPassword(auth, email, passwordInput);
        return { success: true, mustChangePassword: false, role: employee.role };
    } catch(e) {
        throw new Error('Invalid password');
    }
}

async function runTests() {
    console.log("Starting Smoke Tests...");

    let passed = 0;
    let failed = 0;

    const testCases = [
        { id: 'HH0001', pw: 'HH0001@123', expectedMustChange: true, expectedRole: 'Super Admin' },
        { id: 'HH0002', pw: 'HH0002@123', expectedMustChange: true, expectedRole: 'Super Admin' },
        { id: 'HH0003', pw: 'HH0003@123', expectedMustChange: true, expectedRole: 'Super Admin' },
        { id: 'HH0004', pw: 'HH0004@123', expectError: true },
        { id: 'HH0005', pw: 'HH0005@123', expectedMustChange: true, expectedRole: 'Super Admin' },
        { id: 'HH0006', pw: 'HH0006@123', expectedMustChange: true, expectedRole: 'Super Admin' },
        { id: 'HH0007', pw: 'HH0007@123', expectError: true },
        { id: 'HH0008', pw: 'HH0008@123', expectedMustChange: true, expectedRole: 'Master Admin' },
        { id: 'HH0016', pw: 'HH0016@123', expectedMustChange: true, expectedRole: 'User' },
        { id: 'HH0017', pw: 'HH0017@123', expectedMustChange: true, expectedRole: 'User' },
        { id: 'HH0018', pw: 'HH0018@123', expectedMustChange: true, expectedRole: 'User' },
    ];

    for (const tc of testCases) {
        try {
            const res = await mockAuthServiceLogin(tc.id, tc.pw);
            if (tc.expectError) {
                console.error(`[FAIL] ${tc.id}: Expected error but got success.`);
                failed++;
            } else {
                if (res.mustChangePassword === tc.expectedMustChange && res.role === tc.expectedRole) {
                    console.log(`[PASS] ${tc.id}: Logged in as ${res.role}, mustChangePassword=${res.mustChangePassword}`);
                    passed++;
                } else {
                    console.error(`[FAIL] ${tc.id}: Mismatch in role or mustChangePassword`);
                    failed++;
                }
            }
        } catch (e) {
            if (tc.expectError) {
                console.log(`[PASS] ${tc.id}: Blocked as expected. Reason: ${e.message}`);
                passed++;
            } else {
                console.error(`[FAIL] ${tc.id}: Unexpected error: ${e.message}`);
                failed++;
            }
        }
    }

    console.log(`\nTests Complete. Passed: ${passed}, Failed: ${failed}`);
    process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(console.error);
