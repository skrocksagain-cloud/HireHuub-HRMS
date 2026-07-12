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
  where,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

import type { Document } from "../../types/Document";

const COLLECTION_NAME = "documents";

/**
 * ============================================================
 * Create Document
 * ============================================================
 */
export async function createDocument(
  documentData: Document
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTION_NAME),
    {
      ...documentData,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );

  return docRef.id;
}

/**
 * ============================================================
 * Update Document
 * ============================================================
 */
export async function updateDocument(
  id: string,
  documentData: Partial<Document>
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    {
      ...documentData,

      updatedAt: serverTimestamp(),
    }
  );
}

/**
 * ============================================================
 * Get Document By Firestore ID
 * ============================================================
 */
export async function getDocumentById(
  id: string
): Promise<Document | null> {
  const snapshot = await getDoc(
    doc(db, COLLECTION_NAME, id)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Document),
  };
}

/**
 * ============================================================
 * Get Document By Document Number
 * Example:
 * DOC000001
 * ============================================================
 */
export async function getDocumentByNumber(
  documentId: string
): Promise<Document | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("documentId", "==", documentId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const data = snapshot.docs[0];

  return {
    id: data.id,
    ...(data.data() as Document),
  };
}

/**
 * ============================================================
 * Get All Documents
 * ============================================================
 */
export async function getDocuments(): Promise<
  Document[]
> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Document),
  }));
}

/**
 * ============================================================
 * Get Documents By Module
 * ============================================================
 */
export async function getDocumentsByModule(
  module: Document["module"]
): Promise<Document[]> {
  const q = query(
    collection(db, COLLECTION_NAME),

    where("module", "==", module),

    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Document),
  }));
}

/**
 * ============================================================
 * Get Documents By Reference
 * Example:
 * OFF000001
 * HH000001
 * ============================================================
 */
export async function getDocumentsByReference(
  referenceId: string
): Promise<Document[]> {
  const q = query(
    collection(db, COLLECTION_NAME),

    where(
      "referenceId",
      "==",
      referenceId
    ),

    orderBy("version", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Document),
  }));
}

/**
 * ============================================================
 * Archive Document
 * ============================================================
 */
export async function archiveDocument(
  id: string
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTION_NAME, id),
    {
      archived: true,

      status: "Archived",

      archivedAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );
}

/**
 * ============================================================
 * Delete Document
 * ============================================================
 */
export async function deleteDocument(
  id: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTION_NAME, id)
  );
}

/**
 * ============================================================
 * Dashboard Statistics
 * ============================================================
 */

export interface DashboardStats {
  totalDocuments: number;
  generatedToday: number;
  storageUsed: string;
  totalTemplates: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const documents = await getDocuments();

  const today = new Date().toDateString();

  const generatedToday = documents.filter((document) => {
    if (!document.createdAt) {
      return false;
    }

    const createdAt =
      (document.createdAt as any)?.toDate?.();

    if (!createdAt) {
      return false;
    }

    return createdAt.toDateString() === today;
  }).length;

  const totalSize = documents.reduce(
    (total, document) => total + (document.fileSize ?? 0),
    0
  );

  return {
    totalDocuments: documents.length,

    generatedToday,

    storageUsed: formatBytes(totalSize),

    // We currently have four templates.
    // Later this will come from Firestore.
    totalTemplates: 4,
  };
}

/**
 * ============================================================
 * Recent Documents
 * ============================================================
 */

export async function getRecentDocuments(
  limitCount = 10
): Promise<Document[]> {
  const q = query(
    collection(db, COLLECTION_NAME),

    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .slice(0, limitCount)
    .map((item) => ({
      id: item.id,
      ...(item.data() as Document),
    }));
}

/**
 * ============================================================
 * Document Distribution
 * ============================================================
 */

export interface DocumentDistribution {
  label: string;
  count: number;
}

export async function getDocumentDistribution(): Promise<
  DocumentDistribution[]
> {
  const documents = await getDocuments();

  const map = new Map<string, number>();

  documents.forEach((document) => {
    const key = document.documentType;

    map.set(
      key,
      (map.get(key) ?? 0) + 1
    );
  });

  return Array.from(map.entries()).map(
    ([label, count]) => ({
      label,
      count,
    })
  );
}

/**
 * ============================================================
 * Recent Activity
 * ============================================================
 */

export interface DocumentActivity {
  id: string;

  title: string;

  description: string;

  time: string;
}

export async function getRecentActivity(
  limitCount = 10
): Promise<DocumentActivity[]> {
  const documents = await getRecentDocuments(limitCount);

  return documents.map((document) => ({
    id: document.id ?? "",

    title: document.documentType,

    description: `${document.title} (${document.documentId})`,

    time: "Recently",
  }));
}

/**
 * ============================================================
 * Format Bytes
 * ============================================================
 */

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 MB";
  }

  const mb = bytes / (1024 * 1024);

  if (mb < 1024) {
    return `${mb.toFixed(2)} MB`;
  }

  return `${(mb / 1024).toFixed(2)} GB`;
}