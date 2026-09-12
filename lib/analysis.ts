import type { Company } from './types'

export type DeepDive = {
  title: string
  conclusion: string
  confidence: Company['confidence']
  positives: string[]
  risks: string[]
  catalysts: string[]
  facts: { label: string; value: string; meaning: string }[]
  checklist: string[]
  invalidators: string[]
  disclaimer: string
}

const fmt = (value: number | null | undefined, suffix = '') => value == null ? 'Not available' : `${value.toFixed(1)}${suffix}`

export function buildDeepDive(company: Company): DeepDive {
  const bond = company.assetClass === 'bond'
  const positives = bond ? [
    company.pe != null ? `Indicative yield is ${fmt(company.pe, '%')}; compare it with current government yields and inflation.` : 'Yield data needs verification.',
    company.debtToEquity != null && company.debtToEquity < 2 ? 'The available issuer leverage proxy is not elevated.' : 'Issuer leverage needs deeper verification.',
    company.confidence !== 'Low' ? 'The record has enough fields for an initial research screen.' : 'The security is still worth reviewing, but coverage is limited.',
  ] : [
    company.revenueGrowth != null && company.revenueGrowth > 15 ? `Revenue growth of ${fmt(company.revenueGrowth, '%')} is a meaningful operating signal.` : 'Growth is not yet strong enough to stand alone as the thesis.',
    company.roce != null && company.roce > 15 ? `ROCE of ${fmt(company.roce, '%')} suggests productive use of capital.` : 'Capital efficiency needs confirmation from filings.',
    company.debtToEquity != null && company.debtToEquity < 0.6 ? 'Leverage is not a dominant risk in the supplied data.' : 'Balance-sheet risk deserves close monitoring.',
  ]
  const risks = bond ? [
    company.momentum != null && company.momentum > 12 ? 'Price movement may indicate duration or rate sensitivity rather than improving credit quality.' : 'Rate-cycle sensitivity remains relevant.',
    company.confidence === 'Low' ? 'Rating, maturity, liquidity, and covenant details are missing.' : 'Verify the rating agency, maturity, seniority, and liquidity before considering the instrument.',
  ] : [
    company.pe != null && company.pe > 45 ? `The valuation is demanding at ${fmt(company.pe, 'x')} earnings.` : 'Valuation should be compared with peers and normalized earnings.',
    company.confidence === 'Low' ? 'Data coverage is incomplete; do not treat the score as a complete investment case.' : 'Promoter, cash-flow, governance, and industry-cycle checks still need primary-source review.',
  ]
  return {
    title: `${bond ? 'Bond' : 'Equity'} research brief: ${company.name}`,
    conclusion: bond ? `${company.name} is a ${company.sector.toLowerCase()} opportunity where income and issuer safety matter more than headline price growth. The current score is a screening signal, not a credit opinion.` : `${company.name} surfaced because the supplied evidence combines a ${company.score}/100 score with ${fmt(company.revenueGrowth, '%')} revenue growth and ${fmt(company.roce, '%')} ROCE. That makes it worth researching further, not automatically buying.`,
    confidence: company.confidence,
    positives,
    risks,
    catalysts: bond ? ['Next rating action or issuer disclosure', 'Movement in policy rates and comparable bond yields', 'Liquidity and spread changes in the secondary market'] : ['Next quarterly result and operating cash-flow conversion', 'Order-book, capacity, or margin commentary', 'Evidence that growth can continue without leverage expansion'],
    facts: bond ? [
      { label: 'Indicative yield', value: fmt(company.pe, '%'), meaning: 'Potential income signal; verify the exact coupon and price.' },
      { label: 'Issuer safety proxy', value: company.debtToEquity == null ? 'Not available' : `${company.debtToEquity.toFixed(2)}x`, meaning: 'A simplified balance-sheet indicator, not a rating.' },
      { label: 'Rate sensitivity proxy', value: fmt(company.momentum, '%'), meaning: 'Use duration and maturity for a proper assessment.' },
      { label: 'Data status', value: company.status === 'live' ? 'Live' : 'Partial snapshot', meaning: company.source },
    ] : [
      { label: 'Market cap', value: `₹${company.marketCapCr.toLocaleString('en-IN')} Cr`, meaning: 'Size classification for the screen.' },
      { label: 'Revenue growth', value: fmt(company.revenueGrowth, '%'), meaning: 'Growth signal from the supplied dataset.' },
      { label: 'ROCE', value: fmt(company.roce, '%'), meaning: 'Capital efficiency signal.' },
      { label: 'Valuation', value: fmt(company.pe, 'x'), meaning: 'P/E is only meaningful with peer and earnings context.' },
    ],
    checklist: bond ? ['Confirm issuer and instrument identity', 'Read the rating rationale and latest financials', 'Check maturity, coupon, seniority, covenants, and liquidity', 'Compare yield after taxes with alternatives'] : ['Read the latest annual report and investor presentation', 'Verify operating cash flow against reported profit', 'Compare valuation with a relevant peer set', 'Check promoter pledge, related parties, and dilution', 'Review debt maturity and industry-cycle risks'],
    invalidators: bond ? ['A rating downgrade or adverse credit event', 'Yield no longer compensates for duration and liquidity risk', 'Unable to exit at a reasonable spread'] : ['Growth decelerates while valuation remains high', 'Cash flow persistently trails reported profit', 'Leverage, dilution, or governance concerns increase'],
    disclaimer: 'This is an evidence-organizing research aid, not financial advice. Verify every figure against exchange filings, issuer documents, and primary sources before acting.',
  }
}
