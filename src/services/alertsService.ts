import { db } from "@/firebase/db";
import {
    collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp, orderBy
} from "firebase/firestore";
import { getUserTransactions } from "./transactionService";
import { getGoals } from "./goalsService";
import { getInvestments } from "./investmentsService";

export interface Alert {
    id: string;
    type: "warning" | "success" | "info" | "danger";
    title: string;
    message: string;
    time: string; // Formatting handled on client or here
    createdAt: any;
    read: boolean;
    actionable: boolean;
    actionLink?: string; // e.g., "/spending", "/goals"
}

const ALERTS_COLLECTION = "alerts";

export const getAlerts = async (userId: string): Promise<Alert[]> => {
    try {
        const q = query(
            collection(db, ALERTS_COLLECTION),
            where("userId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Alert));
    } catch (error) {
        console.error("Error fetching alerts:", error);
        return [];
    }
};

export const markAsRead = async (alertId: string) => {
    try {
        const alertRef = doc(db, ALERTS_COLLECTION, alertId);
        await updateDoc(alertRef, { read: true });
    } catch (error) {
        console.error("Error marking alert as read:", error);
    }
};

export const deleteAlert = async (alertId: string) => {
    try {
        const alertRef = doc(db, ALERTS_COLLECTION, alertId);
        await deleteDoc(alertRef);
    } catch (error) {
        console.error("Error deleting alert:", error);
    }
};

// --- SMART ALERT GENERATION ---
// This function checks data and creates alerts if they don't exist
export const generateSmartAlerts = async (userId: string) => {
    try {
        // 1. Fetch Data
        const transactions = await getUserTransactions();
        const goals = await getGoals();
        const investments = await getInvestments();

        const alertsToAdd: Partial<Alert>[] = [];

        // 2. Spending Logic (Warning)
        const totalSpending = transactions.reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        if (totalSpending > 50000) { // Example threshold
            alertsToAdd.push({
                type: "warning",
                title: "High Spending Alert",
                message: `You've spent ₹${totalSpending.toLocaleString()} which is over the safe limit of ₹50k.`,
                actionable: true,
                actionLink: "/spending"
            });
        }

        // 3. Goal Logic (Success)
        const completedGoals = goals.filter((g: any) => g.current >= g.target);
        if (completedGoals.length > 0) {
            alertsToAdd.push({
                type: "success",
                title: "Goal Achieved!",
                message: `Congrats! You've reached your goal: ${completedGoals[0].name}.`,
                actionable: false, // No action needed, just celebration
            });
        }

        // 4. Investment Logic (Danger)
        const negativeInvestments = investments.filter((i: any) => i.change < -5);
        if (negativeInvestments.length > 0) {
            alertsToAdd.push({
                type: "danger",
                title: "Portfolio Drop",
                message: `${negativeInvestments[0].name} is down by ${Math.abs(negativeInvestments[0].change)}%. Review now.`,
                actionable: true,
                actionLink: "/investments"
            });
        }

        // 5. Add to Firestore (checking duplicates simply by latest query or just adding for demo)
        // For production w/o duplicates, we'd query existing alerts first. 
        // Here we'll just add them to populate the list for the user to see.
        // To prevent spamming, we could check if an alert with same title created today exists.

        // Simplified: Just one "System" check. Real app would background job this.
        // We'll trust the user to clear them or add a check in specific implementation.

        const existingAlerts = await getAlerts(userId);

        for (const alert of alertsToAdd) {
            // Simple Duplicate Check
            const isDuplicate = existingAlerts.some(a => a.title === alert.title && !a.read);
            if (!isDuplicate) {
                await addDoc(collection(db, ALERTS_COLLECTION), {
                    userId,
                    ...alert,
                    read: false,
                    createdAt: Timestamp.now(),
                    time: "Just now" // Placeholder, UI can calc relative time from createdAt
                });
            }
        }

    } catch (error) {
        console.error("Error generating smart alerts:", error);
    }
};
