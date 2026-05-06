export interface ReportJSON {
  metadata: {
    companyName: string
    reportPeriod: string
    currency: string
    generatedAt: string
    fileName: string
  }

  parsed?: {
    rawData: string
    detectedFormat: string
    keyFields: string[]
    warnings: string[]
  }

  revenue?: {
    totalRevenue: number
    revenueBreakdown: LineItem[]
    revenueGrowth: number | null
    topRevenueSource: string
    analysis: string
  }

  costs?: {
    totalCosts: number
    costBreakdown: LineItem[]
    costRatio: number
    majorCostDriver: string
    analysis: string
  }

  profit?: {
    grossProfit: number
    operatingProfit: number
    netProfit: number
    grossMargin: number
    netMargin: number
    analysis: string
  }

  cashflow?: {
    operatingCashflow: number
    investingCashflow: number
    financingCashflow: number
    netCashflow: number
    analysis: string
  }

  balance?: {
    totalAssets: number
    totalLiabilities: number
    equity: number
    debtToEquity: number
    analysis: string
  }

  ratios?: {
    currentRatio: number | null
    quickRatio: number | null
    roe: number | null
    roa: number | null
    debtRatio: number | null
    peRatio: number | null
    analysis: string
  }

  trends?: {
    revenueGrowthTrend: string
    profitTrend: string
    forecast: string
    chartData: ChartDataPoint[]
    analysis: string
  }

  risks?: {
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
    identifiedRisks: Risk[]
    mitigations: string[]
    analysis: string
  }

  synthesis?: {
    executiveSummary: string
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
    overallRating: number
    recommendations: Recommendation[]
    conclusion: string
  }
}

export interface LineItem {
  name: string
  amount: number
  percentage: number
}

export interface Risk {
  category: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
}

export interface Recommendation {
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  action: string
  rationale: string
  timeframe: string
}

export interface ChartDataPoint {
  period: string
  value: number
  label: string
}
