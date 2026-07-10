import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import type { Designation } from "../../types/Designation";

const COLLECTION = "designations";

/**
 * Get all designations
 */
export async function getDesignations(): Promise<Designation[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("name")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Designation, "id">),
    }));
  } catch (error) {
    console.error("Error loading designations:", error);
    throw error;
  }
}

/**
 * Create designation
 */
export async function createDesignation(
  designation: Designation
): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION), {
      ...designation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Create Designation Error:", error);
    throw error;
  }
}

/**
 * Update designation
 */
export async function updateDesignation(
  id: string,
  designation: Designation
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...designation,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Update Designation Error:", error);
    throw error;
  }
}

/**
 * Delete designation
 */
export async function deleteDesignation(
  id: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    console.error("Delete Designation Error:", error);
    throw error;
  }
}