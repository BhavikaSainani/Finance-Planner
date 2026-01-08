import { auth } from "@/firebase/auth";
import { db } from "@/firebase/db";
import { addDoc, collection, getDocs } from "firebase/firestore";

export const createGoal = async (goal) => {
  const user = auth.currentUser;
  return addDoc(
    collection(db, "users", user.uid, "goals"),
    goal
  );
};

export const getGoals = async () => {
  const user = auth.currentUser;
  const snap = await getDocs(
    collection(db, "users", user.uid, "goals")
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
