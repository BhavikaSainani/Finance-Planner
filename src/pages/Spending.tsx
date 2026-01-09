import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import UploadStatement from "@/components/UploadStatement";
import { auth } from "@/firebase/firebaseConfig";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/utils/categorize";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Car,
  Coffee,
  Film,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  MoreHorizontal,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Upload,
  Zap,
  ArrowRightLeft,
} from "lucide-react";

import {
  CartesianGrid,
  Cell,
  Legend,
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

/* ---------------- CATEGORY META ---------------- */

const CATEGORY_META: Record<string, any> = {
  "Food & Dining": { icon: Coffee, color: "hsl(25, 50%, 35%)", budget: 15000 },
  "Rent": { icon: Home, color: "hsl(38, 90%, 50%)", budget: 25000 },
  "Transportation": { icon: Car, color: "hsl(35, 60%, 45%)", budget: 10000 },
  "Shopping": { icon: ShoppingBag, color: "hsl(30, 40%, 55%)", budget: 12000 },
  "Utilities": { icon: Zap, color: "hsl(20, 35%, 40%)", budget: 6000 },
  "Entertainment": { icon: Film, color: "hsl(45, 70%, 55%)", budget: 5000 },
  "Healthcare": { icon: Heart, color: "hsl(340, 60%, 50%)", budget: 5000 },
  "Education": { icon: GraduationCap, color: "hsl(200, 60%, 45%)", budget: 10000 },
  "Investment": { icon: TrendingUp, color: "hsl(142, 70%, 40%)", budget: 0 },
  "Transfer": { icon: ArrowRightLeft, color: "hsl(210, 50%, 50%)", budget: 0 },
  "Other": { icon: MoreHorizontal, color: "hsl(0, 0%, 50%)", budget: 5000 },
};

/* ---------------- INTERFACES ---------------- */

interface CategoryData {
  name: string;
  value: number;
  budget: number;
  color: string;
  count: number;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: any;
}

/* ---------------- CUSTOM TOOLTIP ---------------- */

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-warm">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-primary font-semibold">
          ₹{Number(payload[0].value).toLocaleString()}
        </p>
        {data.count && (
          <p className="text-xs text-muted-foreground">{data.count} transactions</p>
        )}
      </div>
    );
  }
  return null;
};

const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-warm">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-primary font-semibold">
          ₹{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

/* ---------------- AI INSIGHT GENERATOR ---------------- */

const generateLocalInsight = (
  categoryData: CategoryData[],
  totalSpending: number,
  totalBudget: number
): string => {
  if (categoryData.length === 0) {
    return "Upload your bank statement to get personalized spending insights.";
  }

  const insights: string[] = [];

  // Find highest spending category
  const sortedBySpending = [...categoryData].sort((a, b) => b.value - a.value);
  const topCategory = sortedBySpending[0];

  if (topCategory) {
    const percentage = ((topCategory.value / totalSpending) * 100).toFixed(0);
    insights.push(`${topCategory.name} is your highest expense at ₹${topCategory.value.toLocaleString()} (${percentage}% of total).`);
  }

  // Check budget overruns
  const overBudgetCategories = categoryData.filter(
    (c) => c.budget > 0 && c.value > c.budget
  );

  if (overBudgetCategories.length > 0) {
    const cat = overBudgetCategories[0];
    const overBy = cat.value - cat.budget;
    insights.push(`⚠️ ${cat.name} is over budget by ₹${overBy.toLocaleString()}. Consider reducing spending here.`);
  }

  // Overall budget status
  if (totalBudget > 0) {
    const budgetPercent = (totalSpending / totalBudget) * 100;
    if (budgetPercent > 90) {
      insights.push(`You've used ${budgetPercent.toFixed(0)}% of your total budget. Time to slow down!`);
    } else if (budgetPercent < 50) {
      insights.push(`Great job! You've only used ${budgetPercent.toFixed(0)}% of your budget. Keep it up!`);
    }
  }

  // Find potential savings
  const entertainmentSpend = categoryData.find((c) => c.name === "Entertainment");
  const foodSpend = categoryData.find((c) => c.name === "Food & Dining");

  if (entertainmentSpend && entertainmentSpend.value > 5000) {
    insights.push(`Entertainment spending is ₹${entertainmentSpend.value.toLocaleString()}. Consider free alternatives.`);
  }

  if (foodSpend && foodSpend.value > 10000) {
    insights.push(`Food & Dining at ₹${foodSpend.value.toLocaleString()}. Cooking at home could save 30-40%.`);
  }

  return insights.length > 0
    ? insights[Math.floor(Math.random() * insights.length)]
    : "Your spending looks balanced. Keep tracking to maintain good habits!";
};

/* ---------------- COMPONENT ---------------- */

const Spending = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("Loading insights...");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCategoryData([]);
        setMonthlyTrend([]);
        setRecentTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const transactions = await getUserTransactions(user.uid);

        // Store recent transactions
        setRecentTransactions(
          transactions.slice(0, 10).map((tx: any) => ({
            id: tx.id,
            amount: tx.amount,
            category: tx.category || "Other",
            description: tx.description || "No description",
            createdAt: tx.createdAt,
          }))
        );

        /* ---------- CATEGORY AGGREGATION ---------- */
        const categoryMap: Record<string, CategoryData> = {};

        transactions.forEach((tx: any) => {
          const category = tx.category || "Other";
          const amount = Math.abs(Number(tx.amount || 0));

          if (!categoryMap[category]) {
            const meta = CATEGORY_META[category] || CATEGORY_META["Other"];
            categoryMap[category] = {
              name: category,
              value: 0,
              budget: meta.budget || 0,
              color: meta.color || getCategoryColor(category),
              count: 0,
            };
          }

          categoryMap[category].value += amount;
          categoryMap[category].count += 1;
        });

        const processedCategories = Object.values(categoryMap).sort(
          (a, b) => b.value - a.value
        );
        setCategoryData(processedCategories);

        /* ---------- MONTHLY TREND ---------- */
        const monthMap: Record<string, number> = {};

        transactions.forEach((tx: any) => {
          if (!tx.createdAt) return;

          let date: Date;
          if (tx.createdAt.toDate) {
            date = tx.createdAt.toDate();
          } else if (tx.createdAt instanceof Date) {
            date = tx.createdAt;
          } else {
            date = new Date(tx.createdAt);
          }

          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const monthLabel = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

          if (!monthMap[monthKey]) {
            monthMap[monthKey] = 0;
          }
          monthMap[monthKey] += Math.abs(Number(tx.amount || 0));
        });

        // Sort by date and format for chart
        const sortedMonths = Object.entries(monthMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-6) // Last 6 months
          .map(([key, value]) => {
            const [year, month] = key.split("-");
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
              month: date.toLocaleString("en-US", { month: "short" }),
              spending: value,
            };
          });

        setMonthlyTrend(sortedMonths);

        /* ---- GENERATE INSIGHT ---- */
        const totalSpending = processedCategories.reduce((sum, c) => sum + c.value, 0);
        const totalBudget = processedCategories.reduce((sum, c) => sum + c.budget, 0);

        // Try AI service first, fallback to local
        if (processedCategories.length > 0) {
          setLoadingInsight(true);
          
          // Generate local insight immediately
          const localInsight = generateLocalInsight(processedCategories, totalSpending, totalBudget);
          setAiInsight(localInsight);
          
          // Try to get AI insight (optional enhancement)
          try {
            const summary = processedCategories
              .slice(0, 5)
              .map((c) => `${c.name}: ₹${c.value.toLocaleString()}`)
              .join(", ");
            const prompt = `Analyze this spending: ${summary}. Total: ₹${totalSpending.toLocaleString()}. Give one brief tip (1-2 sentences).`;

            const service = await import("@/services/aiService");
            const advice = await service.getAIAdvice(prompt);
            
            // Only update if we got a meaningful response
            if (advice && !advice.includes("Unable to generate") && advice.length > 20) {
              setAiInsight(advice);
            }
          } catch (error) {
            // Keep local insight on error
            console.log("Using local insight generation");
          }
          
          setLoadingInsight(false);
        } else {
          setAiInsight("Upload your bank statement to get personalized spending insights.");
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setAiInsight("Failed to load data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const totalSpending = categoryData.reduce((sum, c) => sum + c.value, 0);
  const totalBudget = categoryData.reduce((sum, c) => sum + c.budget, 0);
  const budgetPercentage = totalBudget > 0 ? (totalSpending / totalBudget) * 100 : 0;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown";
    
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-serif text-3xl font-bold">Spending Analyzer</h1>
          <p className="text-muted-foreground mt-2">
            Understand your spending patterns and optimize your budget
          </p>
        </div>

        <Button
          variant="default"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Statement
        </Button>

        <UploadStatement ref={fileInputRef} />
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-8 animate-fade-up" style={{ animationDelay: "50ms" }}>
        {["week", "month", "quarter", "year"].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors",
              selectedPeriod === period
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm">Total Spending</p>
            <p className="font-serif text-3xl font-bold mt-2">
              ₹{totalSpending.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-3">
              {categoryData.length > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">
                    {categoryData.length} categories tracked
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No data yet</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-sm">Budget Status</p>
            <p className="font-serif text-3xl font-bold mt-2">
              {budgetPercentage > 0 ? `${Math.round(budgetPercentage)}%` : "—"}
            </p>
            <Progress
              value={Math.min(budgetPercentage, 100)}
              className={cn(
                "mt-3",
                budgetPercentage > 90 && "bg-destructive/20"
              )}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {totalBudget > 0
                ? `₹${totalSpending.toLocaleString()} of ₹${totalBudget.toLocaleString()} budget`
                : "Set budgets to track progress"}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className={cn("h-4 w-4 text-accent", loadingInsight && "animate-pulse")} />
              <p className="text-muted-foreground text-sm">AI Insight</p>
            </div>
            <p className="text-sm leading-relaxed">{aiInsight}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pie Chart */}
        <Card className="animate-fade-up" style={{ animationDelay: "250ms" }}>
          <CardHeader>
            <CardTitle className="font-serif">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryData.slice(0, 6).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-muted-foreground truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs font-medium ml-auto">
                        {((cat.value / totalSpending) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
                <p>No spending data available</p>
                <p className="text-sm">Upload a statement to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="font-serif">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="spending"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                <TrendingUp className="h-12 w-12 mb-3 opacity-30" />
                <p>No trend data available</p>
                <p className="text-sm">Need more transactions to show trends</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="animate-fade-up" style={{ animationDelay: "350ms" }}>
          <CardHeader>
            <CardTitle className="font-serif">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="space-y-4">
                {categoryData.map((cat) => {
                  const Icon = CATEGORY_META[cat.name]?.icon || MoreHorizontal;
                  const isOverBudget = cat.budget > 0 && cat.value > cat.budget;
                  const budgetUsed = cat.budget > 0 ? (cat.value / cat.budget) * 100 : 0;

                  return (
                    <div key={cat.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            <Icon className="h-4 w-4" style={{ color: cat.color }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cat.count} transactions
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{cat.value.toLocaleString()}</p>
                          {cat.budget > 0 && (
                            <p
                              className={cn(
                                "text-xs",
                                isOverBudget ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              {isOverBudget ? "Over " : ""}
                              {budgetUsed.toFixed(0)}% of ₹{cat.budget.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {cat.budget > 0 && (
                        <Progress
                          value={Math.min(budgetUsed, 100)}
                          className={cn("h-1.5", isOverBudget && "bg-destructive/20")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No categories to display
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="animate-fade-up" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle className="font-serif">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((tx) => {
                  const meta = CATEGORY_META[tx.category] || CATEGORY_META["Other"];
                  const Icon = meta.icon || MoreHorizontal;

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg shrink-0"
                          style={{ backgroundColor: `${meta.color}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {tx.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {tx.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(tx.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold text-sm shrink-0">
                        ₹{Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Upload a statement to see your transactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Spending;
