import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import type { Department } from "../../types/Department";

const COLLECTION = "departments";

export async function getDepartments(): Promise<Department[]> {
  const q = query(
    collection(db, COLLECTION),
    orderBy("name")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Department, "id">),
  }));
}

export async function createDepartment(
  department: Department
): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    ...department,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function updateDepartment(
  id: string,
  department: Department
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...department,
    updatedAt: new Date(),
  });
}

export async function deleteDepartment(
  id: string
): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}