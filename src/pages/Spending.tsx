import { useEffect, useState } from "react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import UploadStatement from "@/components/UploadStatement";
import { cn } from "@/lib/utils";

import {
  AlertTriangle,
  Car,
  Coffee,
  Film,
  Home,
  ShoppingBag,
  TrendingUp,
  Zap
} from "lucide-react";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getUserTransactions } from "@/services/transactionService";

// category → icon + color mapping
const CATEGORY_META: any = {
  "Food & Dining": { icon: Coffee, color: "hsl(25, 50%, 35%)", budget: 15000 },
  Rent: { icon: Home, color: "hsl(38, 90%, 50%)", budget: 25000 },
  Transportation: { icon: Car, color: "hsl(35, 60%, 45%)", budget: 10000 },
  Shopping: { icon: ShoppingBag, color: "hsl(30, 40%, 55%)", budget: 8000 },
  Utilities: { icon: Zap, color: "hsl(20, 35%, 40%)", budget: 6000 },
  Entertainment: { icon: Film, color: "hsl(45, 70%, 55%)", budget: 5000 },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-warm">
        <p className="text-primary font-semibold">
          ₹{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const Spending = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const transactions = await getUserTransactions();

      /** -------- CATEGORY AGGREGATION -------- */
      const categoryMap: any = {};

      transactions.forEach((tx: any) => {
        if (!categoryMap[tx.category]) {
          const meta = CATEGORY_META[tx.category];
          categoryMap[tx.category] = {
            name: tx.category,
            value: 0,
            budget: meta?.budget || 0,
            icon: meta?.icon || Coffee,
            color: meta?.color || "hsl(30, 40%, 55%)",
          };
        }
        categoryMap[tx.category].value += tx.amount;
      });

      setCategoryData(Object.values(categoryMap));

      /** -------- MONTHLY TREND -------- */
      const monthMap: any = {};
      transactions.forEach((tx: any) => {
        monthMap[tx.month] = (monthMap[tx.month] || 0) + tx.amount;
      });

      setMonthlyTrend(
        Object.keys(monthMap).map((m) => ({
          month: m,
          spending: monthMap[m],
        }))
      );
    };

    loadData();
  }, []);

  const totalSpending = categoryData.reduce((s, c) => s + c.value, 0);
  const totalBudget = categoryData.reduce((s, c) => s + c.budget, 0);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">Spending Analyzer</h1>
          <p className="text-muted-foreground mt-2">
            Understand your spending patterns
          </p>
        </div>
        <label htmlFor="uploadStatement">
            <Button variant="warm" className="gap-2 cursor-pointer">
              Upload Statement
            </Button>
        </label>

          <UploadStatement />

      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-8">
        {["week", "month", "quarter", "year"].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium",
              selectedPeriod === period
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-warm p-6">
          <p className="text-muted-foreground text-sm">Total Spending</p>
          <p className="font-serif text-3xl font-bold">
            ₹{totalSpending.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <TrendingUp className="h-4 w-4 text-destructive" />
            <span className="text-destructive text-sm">Live data</span>
          </div>
        </div>

        <div className="card-warm p-6">
          <p className="text-muted-foreground text-sm">Budget Used</p>
          <p className="font-serif text-3xl font-bold">
            {totalBudget
              ? Math.round((totalSpending / totalBudget) * 100)
              : 0}
            %
          </p>
          <Progress
            value={totalBudget ? (totalSpending / totalBudget) * 100 : 0}
            className="mt-3"
          />
        </div>

        <div className="card-warm p-6">
          <p className="text-muted-foreground text-sm">AI Insight</p>
          <div className="flex gap-3 mt-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm">
              Insights will improve after statement uploads
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-warm p-6">
          <h3 className="font-serif text-xl mb-6">Spending by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" innerRadius={60} outerRadius={90}>
                {categoryData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card-warm p-6">
          <h3 className="font-serif text-xl mb-6">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="spending" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
};

export default Spending;
