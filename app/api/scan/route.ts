import { NextResponse } from 'next/server'
import { getMarketSnapshot } from '@/lib/market-data'
export async function GET() {
  const { companies, source, live } = await getMarketSnapshot()
  return NextResponse.json({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), source, live, status: live ? 'live' : 'sample', companies: companies.sort((a,b) => b.score-a.score), universeSize: companies.length })
}
