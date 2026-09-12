import { NextRequest, NextResponse } from 'next/server'
import type { Company } from '@/lib/types'
import { buildDeepDive } from '@/lib/analysis'

export async function POST(request: NextRequest) {
  try {
    const company = await request.json() as Company
    if (!company?.name || !company?.factors || !company?.assetClass) {
      return NextResponse.json({ error: 'Complete company evidence is required.' }, { status: 400 })
    }
    return NextResponse.json(buildDeepDive(company))
  } catch {
    return NextResponse.json({ error: 'Analysis could not be generated.' }, { status: 400 })
  }
}
