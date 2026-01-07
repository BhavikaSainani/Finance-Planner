import { auth } from "@/firebase/auth";
import { db } from "@/firebase/db";
import { addDoc, collection, getDocs } from "firebase/firestore";

export const addInvestment = async (data) => {
  const user = auth.currentUser;
  return addDoc(
    collection(db, "users", user.uid, "investments"),
    data
  );
};

export const getInvestments = async () => {
  const user = auth.currentUser;
  const snap = await getDocs(
    collection(db, "users", user.uid, "investments")
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
