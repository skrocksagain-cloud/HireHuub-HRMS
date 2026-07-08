import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useEffect } from "react";

export default function TestFirebase() {
  useEffect(() => {
    async function loadEmployees() {
      const querySnapshot = await getDocs(collection(db, "employees"));

      querySnapshot.forEach((doc) => {
        console.log(doc.id, doc.data());
      });
    }

    loadEmployees();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold text-green-700">
        Firebase Connected ✅
      </h1>
    </div>
  );
}