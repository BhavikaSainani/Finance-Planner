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
  return snap.docs.map(d => {
    const data = d.data();
    const metrics = calculateGoalMetrics(data);
    return { id: d.id, ...data, ...metrics };
  });
};

const calculateGoalMetrics = (goal) => {
  const target = Number(goal.target) || 0;
  const current = Number(goal.current) || 0;
  const deadline = new Date(goal.deadline);
  const today = new Date();

  // Months remaining
  const monthsRemaining = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth());
  const safeMonths = Math.max(monthsRemaining, 1);

  // Monthly Required
  const remainingAmount = Math.max(0, target - current);
  const monthlyRequired = Math.round(remainingAmount / safeMonths);

  // Status & Probability Logic
  // Heuristic: Are we saving enough based on time passed?
  // We assume start date was creation date, but if missing, use naive time check.

  // Simple check: If we have 0 months left and not reached target -> At Risk
  if (monthsRemaining <= 0 && current < target) {
    return {
      monthlyRequired,
      status: "at-risk",
      probability: 10,
      color: "hsl(0, 84%, 60%)" // Red
    };
  }

  // Linear projection
  // If we need to save > 100k/month (just an example threshold) -> maybe hard? 
  // Better: If monthlyRequired is insanely high compared to current progress rate? 
  // Since we don't have "saving rate", we'll just use a time-progress ratio if we had startDate.
  // Without startDate, let's look at % achieved vs Time to deadline? 
  // Let's assume a generic "start" was 1 year ago if unknown? No, unsafe.

  // Let's stick to a simple "Is the deadline dangerously close?" check relative to amount needed.

  // If we need > 20% of the TOTAL target per month, it's risky
  const percentNeededPerMonth = (monthlyRequired / target) * 100;

  let status = "on-track";
  let probability = 90;
  let color = "hsl(142, 70%, 40%)"; // Green

  if (percentNeededPerMonth > 20) {
    status = "at-risk";
    probability = 30;
    color = "hsl(0, 84%, 60%)"; // Red
  } else if (percentNeededPerMonth > 10) {
    status = "at-risk"; // Moderate risk
    probability = 60;
    color = "hsl(48, 96%, 53%)"; // Yellow/Orange
  }

  // Override if completed
  if (current >= target) {
    status = "ahead";
    probability = 100;
  }

  return { monthlyRequired, status, probability, color };
};
