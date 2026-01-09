import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { analyzeSentiment } from "@/services/fingptService";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SentimentAnalysis = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to analyze");
      return;
    }

    try {
      setLoading(true);
      const response = await analyzeSentiment({ text });
      setResult(response);
      toast.success("Sentiment analysis complete!");
    } catch (error) {
      console.error("Failed to analyze sentiment:", error);
      toast.error("Failed to analyze sentiment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return <TrendingUp className="h-8 w-8 text-success" />;
      case "negative":
        return <TrendingDown className="h-8 w-8 text-destructive" />;
      default:
        return <Minus className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "text-success border-success/20 bg-success/10";
      case "negative":
        return "text-destructive border-destructive/20 bg-destructive/10";
      default:
        return "text-muted-foreground border-muted";
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-serif text-3xl font-bold">Financial Sentiment Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Analyze the sentiment of financial news, reports, or market commentary using AI
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Text to Analyze</CardTitle>
              <CardDescription>
                Paste financial news, reports, or any financial text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text">Financial Text</Label>
                <Textarea
                  id="text"
                  placeholder="e.g., Stock prices are rising due to strong earnings reports and positive market sentiment..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Sentiment"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-6">
                  <div
                    className={`p-6 rounded-lg border-2 flex items-center justify-between ${getSentimentColor(
                      result.sentiment
                    )}`}
                  >
                    <div>
                      <p className="text-sm font-medium mb-1">Sentiment</p>
                      <p className="text-2xl font-bold capitalize">
                        {result.sentiment}
                      </p>
                    </div>
                    {getSentimentIcon(result.sentiment)}
                  </div>

                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${result.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card border">
                    <p className="text-sm font-medium mb-2">Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      {result.analysis}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Enter text and click "Analyze Sentiment" to see results
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SentimentAnalysis;
