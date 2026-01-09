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
 */
export const getUserTransactions = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  const q = query(
    collection(db, "transactions"),
    where("uid", "==", user.uid),
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

  const docRef = await addDoc(collection(db, "transactions"), {
    uid: user.uid,
    ...transaction,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};
