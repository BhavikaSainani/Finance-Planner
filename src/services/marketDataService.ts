/**
 * Market Data Service
 * Fetches real-time/simulated market prices for investments
 * 
 * Note: Due to CORS restrictions, we simulate market data with realistic patterns.
 * In production, you would:
 * 1. Use your FastAPI backend as a proxy to fetch from real APIs
 * 2. Use APIs like: Alpha Vantage, Yahoo Finance, NSE/BSE data feeds
 * 3. For MF: AMFI NAV data (https://www.amfiindia.com/spages/NAVAll.txt)
 */

// Market indices data (simulated with realistic patterns)
interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface MutualFundNAV {
  name: string;
  nav: number;
  change: number;
  changePercent: number;
  category: string;
}

interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Base values (approximate real values as of Jan 2026)
const BASE_INDICES = {
  "NIFTY 50": 24500,
  "SENSEX": 81000,
  "NIFTY BANK": 51000,
  "NIFTY IT": 38000,
  "NIFTY MIDCAP 100": 52000,
};

// Popular mutual fund base NAVs (approximate)
const BASE_MF_NAVS: Record<string, { nav: number; category: string }> = {
  // Large Cap
  "HDFC Top 100 Fund": { nav: 985, category: "Large Cap" },
  "ICICI Pru Bluechip Fund": { nav: 98, category: "Large Cap" },
  "SBI Bluechip Fund": { nav: 85, category: "Large Cap" },
  "Axis Bluechip Fund": { nav: 58, category: "Large Cap" },
  "Mirae Asset Large Cap": { nav: 105, category: "Large Cap" },
  
  // Flexi Cap
  "Parag Parikh Flexi Cap": { nav: 78, category: "Flexi Cap" },
  "HDFC Flexi Cap Fund": { nav: 1850, category: "Flexi Cap" },
  "Kotak Flexi Cap Fund": { nav: 72, category: "Flexi Cap" },
  "UTI Flexi Cap Fund": { nav: 320, category: "Flexi Cap" },
  
  // Mid Cap
  "Kotak Emerging Equity": { nav: 118, category: "Mid Cap" },
  "HDFC Mid Cap Opportunities": { nav: 175, category: "Mid Cap" },
  "Axis Midcap Fund": { nav: 98, category: "Mid Cap" },
  
  // Small Cap
  "Nippon Small Cap Fund": { nav: 165, category: "Small Cap" },
  "SBI Small Cap Fund": { nav: 175, category: "Small Cap" },
  "Axis Small Cap Fund": { nav: 95, category: "Small Cap" },
  
  // Index Funds
  "UTI Nifty 50 Index Fund": { nav: 165, category: "Index Fund" },
  "HDFC Index Nifty 50": { nav: 210, category: "Index Fund" },
  "Nippon Nifty BeES ETF": { nav: 265, category: "ETF" },
  
  // ELSS
  "Axis Long Term Equity": { nav: 85, category: "ELSS" },
  "Mirae Asset Tax Saver": { nav: 48, category: "ELSS" },
  "Quant Tax Plan": { nav: 385, category: "ELSS" },
  
  // Debt Funds
  "HDFC Short Term Debt": { nav: 32, category: "Debt" },
  "ICICI Pru Liquid Fund": { nav: 385, category: "Liquid" },
};

// Generate realistic daily fluctuation
const getDailyFluctuation = (): number => {
  // Market typically moves -2% to +2% daily
  const baseChange = (Math.random() - 0.5) * 4;
  // Add some bias based on time of day (markets tend to be more volatile at open/close)
  const hour = new Date().getHours();
  const volatilityMultiplier = (hour >= 9 && hour <= 10) || (hour >= 15 && hour <= 16) ? 1.5 : 1;
  return baseChange * volatilityMultiplier;
};

// Get current market indices
export const getMarketIndices = async (): Promise<MarketIndex[]> => {
  const indices: MarketIndex[] = [];
  
  for (const [name, baseValue] of Object.entries(BASE_INDICES)) {
    const changePercent = getDailyFluctuation();
    const change = (baseValue * changePercent) / 100;
    const value = baseValue + change;
    
    indices.push({
      name,
      value: Math.round(value * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    });
  }
  
  return indices;
};

// Get mutual fund NAVs
export const getMutualFundNAV = async (fundName?: string): Promise<MutualFundNAV[]> => {
  const funds: MutualFundNAV[] = [];
  
  const fundsToFetch = fundName 
    ? Object.entries(BASE_MF_NAVS).filter(([name]) => 
        name.toLowerCase().includes(fundName.toLowerCase())
      )
    : Object.entries(BASE_MF_NAVS);
  
  for (const [name, data] of fundsToFetch) {
    const changePercent = getDailyFluctuation() * 0.5; // MF NAVs move less than stocks
    const change = (data.nav * changePercent) / 100;
    const nav = data.nav + change;
    
    funds.push({
      name,
      nav: Math.round(nav * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      category: data.category,
    });
  }
  
  return funds;
};

// Calculate current value based on investment type and market movement
export const calculateCurrentValue = async (
  invested: number,
  type: string,
  purchaseDate?: Date,
  fundName?: string
): Promise<{ current: number; change: number; changePercent: number }> => {
  // Calculate time-based growth
  const now = new Date();
  const purchase = purchaseDate ? new Date(purchaseDate) : new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // Default 6 months ago
  const daysHeld = Math.floor((now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24));
  
  // Base annual returns by type (approximate historical averages)
  const annualReturns: Record<string, number> = {
    "Stocks": 15,
    "Mutual Fund": 12,
    "SIP": 12,
    "ELSS": 14,
    "Index Fund": 11,
    "ETF": 11,
    "Fixed Deposit": 7,
    "PPF": 7.1,
    "NPS": 10,
    "Gold": 8,
    "Recurring Deposit": 6.5,
    "Debt": 7,
    "Liquid": 6,
  };
  
  const baseReturn = annualReturns[type] || 10;
  
  // Calculate expected return for days held
  const dailyReturn = baseReturn / 365;
  const expectedReturn = dailyReturn * daysHeld;
  
  // Add market volatility (-5% to +5% random factor)
  const volatility = (Math.random() - 0.5) * 10;
  const totalReturnPercent = expectedReturn + volatility;
  
  const change = (invested * totalReturnPercent) / 100;
  const current = invested + change;
  
  return {
    current: Math.round(current * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(totalReturnPercent * 100) / 100,
  };
};

// Update all investments with current market values
export const updateInvestmentsWithMarketData = async (
  investments: Array<{
    id: string;
    name: string;
    type: string;
    invested: number;
    purchaseDate?: Date;
  }>
): Promise<Array<{
  id: string;
  current: number;
  change: number;
  changePercent: number;
}>> => {
  const updates = [];
  
  for (const inv of investments) {
    const { current, change, changePercent } = await calculateCurrentValue(
      inv.invested,
      inv.type,
      inv.purchaseDate,
      inv.name
    );
    
    updates.push({
      id: inv.id,
      current,
      change,
      changePercent,
    });
  }
  
  return updates;
};

// Get market status
export const getMarketStatus = (): { isOpen: boolean; message: string } => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;
  
  // Market hours: 9:15 AM to 3:30 PM IST, Monday to Friday
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  if (day === 0 || day === 6) {
    return { isOpen: false, message: "Market closed (Weekend)" };
  }
  
  if (currentTime < marketOpen) {
    return { isOpen: false, message: `Market opens at 9:15 AM` };
  }
  
  if (currentTime > marketClose) {
    return { isOpen: false, message: "Market closed for today" };
  }
  
  return { isOpen: true, message: "Market is open" };
};

// Format currency in Indian format
export const formatIndianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
