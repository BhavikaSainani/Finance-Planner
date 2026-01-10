import { auth, db } from "@/firebase/firebaseConfig";
import { addDoc, collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export const createGoal = async (goal) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("createGoal: No user logged in");
    throw new Error("User not logged in");
  }
  
  console.log("Creating goal for user:", user.uid);
  
  try {
    const docRef = await addDoc(
      collection(db, "users", user.uid, "goals"),
      {
        ...goal,
        uid: user.uid,
        createdAt: serverTimestamp(),
      }
    );
    console.log("Goal created with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
};

export const getGoals = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("getGoals: No user logged in");
    throw new Error("User not logged in");
  }
  
  try {
    const snap = await getDocs(
      collection(db, "users", user.uid, "goals")
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error getting goals:", error);
    throw error;
  }
};

export const updateGoal = async (goalId, data) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  
  const goalRef = doc(db, "users", user.uid, "goals", goalId);
  return updateDoc(goalRef, data);
};

export const deleteGoal = async (goalId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");
  
  const goalRef = doc(db, "users", user.uid, "goals", goalId);
  return deleteDoc(goalRef);
};
