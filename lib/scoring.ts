import type { Company, Factor } from './types'

export function scoreCompany(input: Omit<Company, 'score' | 'confidence' | 'factors' | 'tags'>): Company {
  if (input.assetClass === 'bond') return scoreBond(input)
  const growth = input.revenueGrowth == null ? 42 : Math.min(100, Math.max(0, input.revenueGrowth * 2.2 + 35))
  const quality = input.roe == null || input.roce == null ? 45 : Math.min(100, input.roe * 2.2 + input.roce * 0.7)
  const safety = input.debtToEquity == null ? 45 : Math.max(0, Math.min(100, 100 - input.debtToEquity * 34))
  const value = input.pe == null ? 45 : Math.max(0, Math.min(100, 100 - Math.max(0, input.pe - 18) * 2.2))
  const trend = Math.max(0, Math.min(100, 50 + input.momentum * 2.5))
  const completeness = [input.revenueGrowth, input.profitGrowth, input.roe, input.roce, input.debtToEquity, input.pe].filter((v) => v != null).length / 6 * 100
  const factors: Factor[] = [
    { name: 'Durable growth', score: Math.round(growth), weight: 28, note: 'Revenue and earnings trajectory' },
    { name: 'Quality', score: Math.round(quality), weight: 22, note: 'ROE and ROCE efficiency' },
    { name: 'Balance sheet', score: Math.round(safety), weight: 18, note: 'Debt-to-equity safety' },
    { name: 'Valuation sanity', score: Math.round(value), weight: 14, note: 'P/E relative to growth' },
    { name: 'Price trend', score: Math.round(trend), weight: 12, note: 'Recent momentum signal' },
    { name: 'Data completeness', score: Math.round(completeness), weight: 6, note: 'Coverage penalty applied' },
  ]
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0) / 100)
  const tags = [input.revenueGrowth != null && input.revenueGrowth > 18 ? 'Revenue inflection' : '', input.roce != null && input.roce > 18 ? 'Capital efficient' : '', input.debtToEquity != null && input.debtToEquity < 0.4 ? 'Low leverage' : '', input.marketCapCr < 5000 ? 'Under-covered' : ''].filter(Boolean)
  return { ...input, score, confidence: completeness >= 83 ? 'High' : completeness >= 65 ? 'Medium' : 'Low', factors, tags }
}

function scoreBond(input: Omit<Company, 'score' | 'confidence' | 'factors' | 'tags'>): Company {
  const yieldScore = input.pe == null ? 45 : Math.min(100, Math.max(0, 35 + input.pe * 4))
  const safety = input.debtToEquity == null ? 45 : Math.max(0, Math.min(100, 100 - input.debtToEquity * 24))
  const duration = input.momentum == null ? 50 : Math.max(0, Math.min(100, 70 - Math.abs(input.momentum) * 1.8))
  const completeness = [input.pe, input.debtToEquity, input.momentum].filter((v) => v != null).length / 3 * 100
  const factors: Factor[] = [
    { name: 'Yield attractiveness', score: Math.round(yieldScore), weight: 35, note: 'Indicative yield / coupon signal' },
    { name: 'Issuer safety', score: Math.round(safety), weight: 35, note: 'Credit and balance-sheet proxy' },
    { name: 'Rate sensitivity', score: Math.round(duration), weight: 20, note: 'Duration and rate-cycle risk' },
    { name: 'Data completeness', score: Math.round(completeness), weight: 10, note: 'Coverage penalty applied' },
  ]
  const score = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0) / 100)
  const tags = [input.pe != null && input.pe > 8 ? 'Yield pickup' : '', input.debtToEquity != null && input.debtToEquity < 2 ? 'Lower issuer leverage' : '', input.momentum != null && input.momentum < 12 ? 'Rate-sensitive' : ''].filter(Boolean)
  return { ...input, score, confidence: completeness >= 99 ? 'High' : completeness >= 66 ? 'Medium' : 'Low', factors, tags }
}
