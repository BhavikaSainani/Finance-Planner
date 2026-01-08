import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { auth } from "@/firebase/firebaseConfig";
import { cn } from "@/lib/utils";
import { getUserTransactions } from "@/services/transactionService";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowRight,
  Calendar,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* ------------------ Projection Logic ------------------ */
const generateProjection = (
  currentSavings: number,
  monthlySavings: number,
  years: number = 10
) => {
  const data = [];
  let current = currentSavings;
  let improved = currentSavings;

  const improvedSavings = monthlySavings * 1.5; // +50%

  for (let year = 0; year <= years; year++) {
    data.push({
      year: `Year ${year}`,
      current: Math.round(current),
      improved: Math.round(improved),
    });

    current += monthlySavings * 12 * 1.08;
    improved += improvedSavings * 12 * 1.08;
  }

  return data;
};

/* ------------------ Tooltip ------------------ */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-warm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-sm">
          {p.name}: ₹{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const Simulator = () => {
  const [monthlySavings, setMonthlySavings] = useState(15000);
  const [currentSavings, setCurrentSavings] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  /* -------- FETCH USER DATA -------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const txns = await getUserTransactions(user.uid);

      /**
       * REALISTIC LOGIC:
       * income = +amount
       * expense = -amount
       */
      const netSavings = txns.reduce(
        (sum: number, tx: any) => sum + Number(tx.amount || 0),
        0
      );

      setCurrentSavings(Math.max(netSavings, 0));
    });

    return () => unsub();
  }, []);

  const projectionData = generateProjection(currentSavings, monthlySavings);
  const currentFuture = projectionData.at(-1)?.current || 0;
  const improvedFuture = projectionData.at(-1)?.improved || 0;
  const difference = improvedFuture - currentFuture;

  const handleSimulate = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold">
            Future You Simulator
          </h1>
          <p className="text-muted-foreground mt-2">
            See how small decisions today shape your future
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="soft" onClick={() => setMonthlySavings(15000)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button variant="warm" onClick={handleSimulate}>
            <Play className="h-4 w-4 mr-2" />
            Simulate
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="card-warm p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-6 w-6 text-accent" />
          <h3 className="font-serif text-xl font-semibold">
            Monthly Savings Adjustment
          </h3>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between mb-4">
              <span className="text-muted-foreground">
                Monthly Savings
              </span>
              <span className="font-serif text-2xl font-bold text-primary">
                ₹{monthlySavings.toLocaleString()}
              </span>
            </div>

            <Slider
              value={[monthlySavings]}
              onValueChange={(v) => setMonthlySavings(v[0])}
              min={5000}
              max={50000}
              step={1000}
            />
          </div>

          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Current Path
              </p>
              <p className="font-serif text-xl font-bold">
                ₹{monthlySavings.toLocaleString()}
              </p>
            </div>

            <ArrowRight />

            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                Improved Path
              </p>
              <p className="font-serif text-xl font-bold text-success">
                ₹{Math.round(monthlySavings * 1.5).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card-warm p-6 mb-8">
        <h3 className="font-serif text-xl mb-6">10-Year Projection</h3>

        <div className={cn("h-80", isAnimating && "opacity-50")}>
          <ResponsiveContainer>
            <AreaChart data={projectionData}>
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(v) => `₹${v / 100000}L`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              <Area
                dataKey="current"
                name="Current Path"
                stroke="hsl(var(--muted-foreground))"
                fillOpacity={0.2}
              />
              <Area
                dataKey="improved"
                name="Improved Path"
                stroke="hsl(var(--success))"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-warm p-6">
          <Calendar className="mb-3" />
          <p className="text-muted-foreground">In 10 Years</p>
          <p className="font-serif text-2xl font-bold">
            ₹{currentFuture.toLocaleString()}
          </p>
        </div>

        <div className="card-warm p-6">
          <TrendingUp className="mb-3 text-success" />
          <p className="text-muted-foreground">Extra Wealth</p>
          <p className="font-serif text-2xl font-bold text-success">
            +₹{difference.toLocaleString()}
          </p>
        </div>

        <div className="card-warm p-6">
          <Sparkles className="mb-3 text-accent" />
          <p className="font-medium">
            Saving a little more every month compounds into life-changing wealth.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Simulator;
