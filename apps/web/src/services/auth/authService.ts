import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export async function getEmployee(employeeId: string) {
  try {
    const docRef = doc(db, "employees", employeeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    };
  } catch (error) {
    console.error("Employee Service Error:", error);
    throw error;
  }
}