import { auth } from "@/firebase/auth";
import { db } from "@/firebase/firebaseConfig";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

/**
 * Get transactions for logged-in user
 * @param uid - Optional user ID (uses current user if not provided)
 */
export const getUserTransactions = async (uid?: string) => {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) throw new Error("User not logged in");

  const q = query(
    collection(db, "transactions"),
    where("uid", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

/**
 * Add a transaction for logged-in user
 */
export const addTransaction = async (transaction: {
  amount: number;
  category: string;
  description?: string;
  createdAt?: Date;
}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  // Use provided date or current timestamp
  const timestamp = transaction.createdAt
    ? Timestamp.fromDate(transaction.createdAt)
    : Timestamp.now();

  const docRef = await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description || "",
    createdAt: timestamp,
  });

  return docRef.id;
};
