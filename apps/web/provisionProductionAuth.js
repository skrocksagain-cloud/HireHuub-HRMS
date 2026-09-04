import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const app = initializeApp({ apiKey: "AIzaSyBselGx7GmvCmickXwgwDgCucBGoQFhWUY", projectId: "hirehuub-hrms-86942" });
const db = getFirestore(app);

const approvedEmployees = [
  { id: 'HH0001', name: 'Swetlana Hazra', status: 'Active', role: 'Super Admin' },
  { id: 'HH0002', name: 'Ananya Basak', status: 'Active', role: 'Super Admin' },
  { id: 'HH0003', name: 'Sumitra Kayal', status: 'Active', role: 'Super Admin' },
  { id: 'HH0004', name: 'Shubham Bhaduri', status: 'Inactive', role: 'Super Admin' },
  { id: 'HH0005', name: 'Somnath Kayal', status: 'Active', role: 'Super Admin' },
  { id: 'HH0006', name: 'Sourav Basak', status: 'Active', role: 'Super Admin' },
  { id: 'HH0007', name: 'Dali Bhaduri', status: 'Inactive', role: 'Super Admin' },
  { id: 'HH0008', name: 'Tamalika De', status: 'Active', role: 'Master Admin' },
  { id: 'HH0016', name: 'Ishika Srivastav', status: 'Active', role: 'User' },
  { id: 'HH0017', name: 'Neha Roy', status: 'Active', role: 'User' },
  { id: 'HH0018', name: 'Sudip Adhikari', status: 'Active', role: 'User' }
];

async function provision() {
  console.log("Starting Production Authentication Provisioning...");
  for (const emp of approvedEmployees) {
    const docRef = doc(db, 'employees', emp.id);
    const snap = await getDoc(docRef);
    
    const email = `${emp.id.toLowerCase()}@hirehuub.local`;

    const data = {
      employeeId: emp.id,
      name: emp.name,
      accountStatus: emp.status === 'Active' ? 'Pending Activation' : 'Inactive',
      role: emp.role,
      email: email,
      firstLoginCompleted: false,
      failedLoginAttempts: 0,
      mobileVerified: false,
      updatedAt: new Date().toISOString()
    };

    if (!snap.exists()) {
      data.createdAt = new Date().toISOString();
      await setDoc(docRef, data);
      console.log(`[CREATED] ${emp.id} - ${emp.name} (${data.accountStatus})`);
    } else {
      // Clean up legacy fields to force reactivation if they were partially active
      data.passwordHash = null;
      data.tempPasswordHash = null;
      await updateDoc(docRef, data);
      console.log(`[UPDATED] ${emp.id} - ${emp.name} (${data.accountStatus})`);
    }
  }
  console.log("Provisioning Complete.");
  process.exit(0);
}

provision().catch(err => {
  console.error(err);
  process.exit(1);
});
