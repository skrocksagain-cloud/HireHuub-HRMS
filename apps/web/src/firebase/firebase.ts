import { useEffect } from "react";
import { login } from "../../services/auth/authService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export default function TestFirebase() {
  useEffect(() => {
    async function test() {
      try {
        await login("admin@hirehuub.in", "Admin@123");

        console.log("Logged In Successfully");

        const snapshot = await getDocs(collection(db, "employees"));

        snapshot.forEach((doc) => {
          console.log(doc.id, doc.data());
        });

      } catch (error) {
        console.error(error);
      }
    }

    test();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-green-700">
        Firebase Connected ✅
      </h1>
    </div>
  );
}