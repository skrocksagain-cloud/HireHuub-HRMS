import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import type { Role } from "../../types/Role";

const COLLECTION = "roles";

/**
 * Get all roles
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      orderBy("name")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Role, "id">),
    }));
  } catch (error) {
    console.error("Error loading roles:", error);
    throw error;
  }
}

/**
 * Get role by document ID
 */
export async function getRoleById(
  id: string
): Promise<Role | null> {
  try {
    const snapshot = await getDoc(
      doc(db, COLLECTION, id)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Role, "id">),
    };
  } catch (error) {
    console.error("Error loading role:", error);
    throw error;
  }
}

/**
 * Create role
 */
export async function createRole(
  role: Role
): Promise<void> {
  try {
    await addDoc(collection(db, COLLECTION), {
      ...role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Create Role Error:", error);
    throw error;
  }
}

/**
 * Update role
 */
export async function updateRole(
  id: string,
  role: Role
): Promise<void> {
  try {
    await updateDoc(
      doc(db, COLLECTION, id),
      {
        ...role,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error("Update Role Error:", error);
    throw error;
  }
}

/**
 * Delete role
 */
export async function deleteRole(
  id: string
): Promise<void> {
  try {
    await deleteDoc(
      doc(db, COLLECTION, id)
    );
  } catch (error) {
    console.error("Delete Role Error:", error);
    throw error;
  }
}