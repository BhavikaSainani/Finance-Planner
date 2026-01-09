import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { forecastStock } from "@/services/fingptService";
import { TrendingUp, TrendingDown, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const StockForecast = () => {
  const [ticker, setTicker] = useState("");
  const [nWeeks, setNWeeks] = useState([1]);
  const [useBasics, setUseBasics] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleForecast = async () => {
    if (!ticker.trim()) {
      toast.error("Please enter a stock ticker");
      return;
    }

    try {
      setLoading(true);
      const response = await forecastStock({
        ticker: ticker.toUpperCase(),
        n_weeks: nWeeks[0],
        use_basics: useBasics,
      });
      setResult(response);
      toast.success("Forecast generated successfully!");
    } catch (error) {
      console.error("Failed to forecast stock:", error);
      toast.error("Failed to generate forecast. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold">Stock Price Forecast</h1>
          <p className="text-muted-foreground mt-2">
            Get AI-powered stock price predictions and market analysis
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Parameters</CardTitle>
              <CardDescription>
                Enter stock ticker and configure forecast settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Stock Ticker</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., AAPL, MSFT, GOOGL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the stock symbol (e.g., AAPL for Apple)
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Forecast Period (Weeks)</Label>
                  <span className="text-sm font-semibold">{nWeeks[0]} week{nWeeks[0] !== 1 ? 's' : ''}</span>
                </div>
                <Slider
                  value={nWeeks}
                  onValueChange={setNWeeks}
                  min={1}
                  max={4}
                  step={1}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useBasics"
                  checked={useBasics}
                  onCheckedChange={(checked) => setUseBasics(checked as boolean)}
                />
                <Label htmlFor="useBasics" className="cursor-pointer">
                  Include fundamental analysis
                </Label>
              </div>

              <Button
                onClick={handleForecast}
                disabled={loading || !ticker.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Forecast...
                  </>
                ) : (
                  "Generate Forecast"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm font-medium mb-2">Prediction</p>
                    <p className="text-lg font-semibold text-accent">
                      {result.prediction}
                    </p>
                  </div>

                  {result.positive_developments && result.positive_developments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        <p className="font-medium">Positive Developments</p>
                      </div>
                      <ul className="space-y-2">
                        {result.positive_developments.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-success mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.potential_concerns && result.potential_concerns.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <p className="font-medium">Potential Concerns</p>
                      </div>
                      <ul className="space-y-2">
                        {result.potential_concerns.map((item: string, index: number) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-destructive mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium mb-2">Detailed Analysis</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {result.analysis}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Enter a stock ticker and click "Generate Forecast" to see results
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default StockForecast;
