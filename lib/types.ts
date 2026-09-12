export type Factor = { name: string; score: number; weight: number; note: string }
export type AssetClass = 'equity' | 'bond'
export type Company = {
  assetClass: AssetClass
  symbol: string
  name: string
  sector: string
  marketCapCr: number
  price: number
  change: number
  revenueGrowth: number | null
  profitGrowth: number | null
  roe: number | null
  roce: number | null
  debtToEquity: number | null
  pe: number | null
  momentum: number
  score: number
  confidence: 'High' | 'Medium' | 'Low'
  status: 'live' | 'sample' | 'partial'
  factors: Factor[]
  tags: string[]
  source: string
  asOf: string
}
export type Scan = { id: string; createdAt: string; source: string; status: string; companies: Company[]; universeSize: number }
