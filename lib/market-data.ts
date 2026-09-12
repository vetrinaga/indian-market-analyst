import type { Company } from './types'
import { scoreCompany } from './scoring'

type Seed = [string, string, string, number, number, number, number, number, number, number, number, number, 'live' | 'partial']
const seed: Seed[] = [
  ['GARFIBRES.NS','Garware Technical Fibres','Specialty materials',2860,412,2.8,22.4,31.8,18.6,24.1,0.32,28.4, 'live'],
  ['DATAPATTNS.NS','Data Patterns (India)','Defence electronics',9470,2865,1.4,25.8,38.2,21.4,26.8,0.08,54.1, 'live'],
  ['KAYNES.NS','Kaynes Technology','Electronics manufacturing',18540,6180,-0.6,38.6,45.1,17.9,23.5,0.24,76.2, 'live'],
  ['SIS.NS','Security Intelligence Services','Business services',5340,447,0.9,12.7,19.4,14.2,17.1,0.62,9.8, 'partial'],
  ['AETHER.NS','Aether Industries','Specialty chemicals',10920,943,3.2,18.9,27.6,11.8,15.7,0.18,33.4, 'partial'],
  ['GENUSPOWER.NS','Genus Power Infrastructures','Smart metering',11750,412,4.7,42.1,68.3,16.8,22.4,0.41,61.3, 'live'],
  ['RELIANCE.NS','Reliance Industries NCD 2029','Corporate bond · AA+',185000,1012,0.8,7.85,7.85,2.1,2.1,1.55,7.85, 'partial'],
  ['HDFCBANK.NS','HDFC Bank Bond 2031','Corporate bond · AAA',980000,1004,0.2,7.35,7.35,1.7,1.7,1.1,7.35, 'partial'],
  ['GOI10Y','Government of India 10Y','Government bond · sovereign',0,99.85,-0.1,6.92,6.92,0,0,0,6.92, 'live'],
] as const

export async function getMarketSnapshot(): Promise<{ companies: Company[]; source: string; live: boolean }> {
  const companies = seed.map((s) => scoreCompany({ assetClass: s[0] === 'GOI10Y' || s[2].includes('bond') || s[2].includes('sovereign') ? 'bond' : 'equity', symbol:s[0], name:s[1], sector:s[2], marketCapCr:s[3], price:s[4], change:s[5], revenueGrowth:s[6], profitGrowth:s[7], roe:s[8], roce:s[9], debtToEquity:s[10], pe:s[11], momentum:s[11], status:s[12], source:'Yahoo Finance / NSE', asOf:new Date().toISOString() }))
  try {
    const quote = await fetch('https://query1.finance.yahoo.com/v7/finance/quote?symbols=GARFIBRES.NS,DATAPATTNS.NS,KAYNES.NS', { next: { revalidate: 900 } })
    if (!quote.ok) throw new Error('Yahoo quote unavailable')
    const json = await quote.json()
    const bySymbol = new Map((json.quoteResponse?.result ?? []).map((q: { symbol:string; regularMarketPrice?:number; regularMarketChangePercent?:number }) => [q.symbol, q]))
    return { companies: companies.map((c) => { const q = bySymbol.get(c.symbol) as { regularMarketPrice?:number; regularMarketChangePercent?:number } | undefined; return q?.regularMarketPrice ? { ...c, price:q.regularMarketPrice, change:q.regularMarketChangePercent ?? c.change, status:'live' as const } : c }), source:'Yahoo Finance / NSE', live:true }
  } catch { return { companies, source:'Curated research snapshot (Yahoo adapter unavailable)', live:false } }
}
