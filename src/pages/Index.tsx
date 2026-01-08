import { auth } from "@/firebase/auth";
import { db } from "@/firebase/db";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { InvestmentSummary } from "@/components/dashboard/InvestmentSummary";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RecentAlerts } from "@/components/dashboard/RecentAlerts";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { WellBeingScore } from "@/components/dashboard/WellBeingScore";
import { MainLayout } from "@/components/layout/MainLayout";

const Index = () => {
  const [name, setName] = useState("User");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      // 1️⃣ Firestore name
      if (snap.exists() && snap.data().name) {
        setName(snap.data().name);
        return;
      }

      // 2️⃣ Auth displayName fallback
      if (user.displayName) {
        setName(user.displayName);

        // Auto-heal old accounts
        await setDoc(
          userRef,
          {
            name: user.displayName,
            email: user.email,
            updatedAt: new Date(),
          },
          { merge: true }
        );
        return;
      }

      // 3️⃣ Default
      setName("User");
    });

    return () => unsubscribe();
  }, []);

  return (
    <MainLayout>
      <div className="mb-8 animate-fade-up">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Good Morning, <span className="gradient-text">{name}</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's your financial overview for today
        </p>
      </div>

      <QuickStats />
      <WellBeingScore score={72} previousScore={68} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SpendingChart />
        <GoalsProgress />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentSummary />
        <RecentAlerts />
      </div>
    </MainLayout>
  );
};

export default Index;
