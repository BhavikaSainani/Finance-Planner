import { db } from "@/firebase/firebaseConfig";
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
    time: string;
    createdAt: number; // Unix timestamp
    read: boolean;
    actionable: boolean;
    actionLink?: string;
}

const LOCAL_STORAGE_KEY = "wealthwise_alerts";

const getLocalAlerts = (): Alert[] => {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveLocalAlerts = (alerts: Alert[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alerts));
};

export const getAlerts = async (userId: string): Promise<Alert[]> => {
    // We simulate async to match interface, though localStorage is sync.
    // In local mode, we ignore userId for storage key, or could mix it in.
    // For simplicity, we just filter by userId if we wanted, but let's just use one store.

    const alerts = getLocalAlerts();
    return alerts.sort((a, b) => b.createdAt - a.createdAt);
};

export const markAsRead = async (alertId: string) => {
    const alerts = getLocalAlerts();
    const updated = alerts.map(a => a.id === alertId ? { ...a, read: true } : a);
    saveLocalAlerts(updated);
};

export const deleteAlert = async (alertId: string) => {
    const alerts = getLocalAlerts();
    const updated = alerts.filter(a => a.id !== alertId);
    saveLocalAlerts(updated);
};

export const generateSmartAlerts = async (userId: string) => {
    try {
        // 1. Fetch Data
        const transactions = await getUserTransactions(userId).catch(() => []);
        const goals = await getGoals().catch(() => []);
        const investments = await getInvestments().catch(() => []);

        const existingAlerts = getLocalAlerts();
        const alertsToAdd: Partial<Alert>[] = [];

        // 0. Welcome Alert
        if (existingAlerts.length === 0) {
            alertsToAdd.push({
                type: "info",
                title: "Welcome to WealthWise! 👋",
                message: "This is your Alerts center. Important financial updates and insights will appear here.",
                actionable: true,
                actionLink: "/dashboard",
            });
        }

        // 2. Spending Logic (Warning) - expenses are negative amounts
        const totalSpending = (transactions as any[])
            .filter((t: any) => t.amount < 0) // Only expenses (negative)
            .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

        if (totalSpending > 50000) { // Example threshold
            alertsToAdd.push({
                type: "warning",
                title: "Spending Alert",
                message: `You've spent ₹${totalSpending.toLocaleString()} this month. Keep an eye on your budget!`,
                actionable: true,
                actionLink: "/spending"
            });
        }

        // Low spending (good news!)
        if (totalSpending > 0 && totalSpending < 20000) {
            alertsToAdd.push({
                type: "success",
                title: "Great Savings Month!",
                message: `Your spending this month is only ₹${totalSpending.toLocaleString()}. Keep up the good work!`,
                actionable: false,
            });
        }

        // 2. Goal Logic
        const completedGoals = goals.filter((g: any) => g.current >= g.target);
        if (completedGoals.length > 0) {
            alertsToAdd.push({
                type: "success",
                title: "Goal Achieved!",
                message: `Congrats! You've reached your goal: ${completedGoals[0].name}.`,
                actionable: false,
            });
        }

        // 3. Investment Logic
        const negativeInvestments = investments.filter((i: any) => i.change < -2);
        if (negativeInvestments.length > 0) {
            alertsToAdd.push({
                type: "danger",
                title: "Portfolio Drop",
                message: `${negativeInvestments[0].name} is down by ${Math.abs(negativeInvestments[0].change)}%.`,
                actionable: true,
                actionLink: "/investments"
            });
        }

        let hasNew = false;
        for (const alert of alertsToAdd) {
            // Duplicate Check
            const isDuplicate = existingAlerts.some(a => a.title === alert.title && !a.read);
            if (!isDuplicate) {
                existingAlerts.push({
                    id: Math.random().toString(36).substring(7),
                    userId, // stored for interface consistency
                    ...alert,
                    read: false,
                    createdAt: Date.now(),
                    time: "Just now",
                } as Alert);
                hasNew = true;
            }
        }

        if (hasNew) {
            saveLocalAlerts(existingAlerts);
        }

    } catch (error) {
        console.error("Error generating smart alerts:", error);
    }
};
