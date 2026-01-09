import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { predictFinancialData } from "@/services/mlService";
import { getUserTransactions } from "@/services/transactionService";
import { auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { TrendingUp, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MLPredictions = () => {
  const [predictionType, setPredictionType] = useState<"expense" | "income" | "savings">("expense");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const transactions = await getUserTransactions(user.uid);
        
        // Process transactions by month
        const monthlyData: Record<string, number> = {};
        
        transactions.forEach((tx: any) => {
          const date = new Date(tx.date?.seconds * 1000 || tx.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (predictionType === "expense" && tx.amount < 0) {
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Math.abs(tx.amount);
          } else if (predictionType === "income" && tx.amount > 0) {
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + tx.amount;
          }
        });

        // Convert to array format for API
        const dataArray = Object.entries(monthlyData)
          .sort()
          .slice(-6) // Last 6 months
          .map(([key, amount], index) => {
            const [year, month] = key.split('-');
            return {
              amount,
              month: parseInt(month),
              year: parseInt(year),
            };
          });

        setHistoricalData(dataArray);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }
    });

    return () => unsubscribe();
  }, [predictionType]);

  const handlePredict = async () => {
    if (historicalData.length < 2) {
      toast.error("Need at least 2 months of data to make predictions");
      return;
    }

    try {
      setLoading(true);
      const response = await predictFinancialData({
        data: historicalData,
        prediction_type: predictionType,
      });
      setResult(response);
      toast.success("Prediction generated successfully!");
    } catch (error) {
      console.error("Failed to predict:", error);
      toast.error("Failed to generate prediction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const chartData = historicalData.map((item, index) => ({
    month: `Month ${index + 1}`,
    value: item.amount,
  }));

  if (result) {
    chartData.push({
      month: "Next Period",
      value: result.predictions[0],
    });
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold">ML Financial Predictions</h1>
          <p className="text-muted-foreground mt-2">
            Use machine learning to predict your future expenses, income, or savings
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Settings</CardTitle>
              <CardDescription>
                Select prediction type and generate forecast
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="predictionType">Prediction Type</Label>
                <Select
                  value={predictionType}
                  onValueChange={(value: "expense" | "income" | "savings") =>
                    setPredictionType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expenses</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Historical Data</p>
                <p className="text-sm text-muted-foreground">
                  {historicalData.length > 0
                    ? `${historicalData.length} months of data available`
                    : "No data available. Please add transactions."}
                </p>
              </div>

              <Button
                onClick={handlePredict}
                disabled={loading || historicalData.length < 2}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Prediction...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Prediction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Prediction Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <p className="text-sm font-medium mb-1">Predicted {predictionType}</p>
                    <p className="text-3xl font-bold text-success">
                      ₹{result.predictions[0]?.toLocaleString() || "N/A"}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium mb-3">Trend Analysis</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Direction</span>
                        <span className="text-sm font-semibold capitalize">
                          {result.trends.direction}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Change</span>
                        <span className="text-sm font-semibold">
                          ₹{result.trends.average_change.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Current Value</span>
                        <span className="text-sm font-semibold">
                          ₹{result.trends.current_value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.insights && result.insights.length > 0 && (
                    <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-sm font-medium mb-2">Insights</p>
                      <ul className="space-y-1">
                        {result.insights.map((insight: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {chartData.length > 0 && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name="Historical"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {historicalData.length < 2
                    ? "Need at least 2 months of data to generate predictions"
                    : "Click 'Generate Prediction' to see results"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default MLPredictions;
