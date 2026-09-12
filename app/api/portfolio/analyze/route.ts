import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { read, utils } from 'xlsx'

type Row = Record<string, unknown>
const normalize = (value: unknown) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
const valueFor = (row: Row, names: string[]) => { const key = Object.keys(row).find((candidate) => names.includes(normalize(candidate))); return key ? row[key] : undefined }
const numberValue = (value: unknown) => { const parsed = Number(String(value ?? '').replace(/,/g, '').replace(/[₹%]/g, '').trim()); return Number.isFinite(parsed) ? parsed : null }
const positive = (value: unknown) => { const parsed = numberValue(value); return parsed != null && parsed > 0 ? parsed : null }
const clean = (value: unknown) => String(value ?? '').trim().toUpperCase()
const sectorFor = (name: string) => /BANK|FINANCE|RBL|PMC|IL&FS/i.test(name) ? 'Financials' : /POWER|GRID|SUZLON|ADANI POWER|TATA POWER/i.test(name) ? 'Utilities & Power' : /STEEL|ALUMIN|COPPER|NMDC/i.test(name) ? 'Metals & Mining' : /CEMENT/i.test(name) ? 'Cement' : /TATA|MOTHERSON|MOTOR|ASHOKA/i.test(name) ? 'Automobiles' : 'Unclassified'

export async function POST(request: Request) {
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required to analyze a private portfolio.' }, { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) return NextResponse.json({ error: 'Please upload an .xlsx Excel file.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Please keep the workbook under 5 MB.' }, { status: 400 })

    const workbook = read(Buffer.from(await file.arrayBuffer()), { cellDates: true })
    const sheetName = workbook.SheetNames.find((name) => utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null }).length > 0)
    if (!sheetName) return NextResponse.json({ error: 'No usable rows were found in the workbook.' }, { status: 400 })
    const matrix = utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: null })
    const headerIndex = matrix.findIndex((row) => { const keys = row.map(normalize); return keys.includes('stockname') && keys.includes('quantity') && (keys.includes('closingvalue') || keys.includes('currentvalue')) })
    if (headerIndex < 0) return NextResponse.json({ error: 'We could not find a holdings table. Expected headers such as Stock Name, Quantity, Average buy price, Closing price, and Closing value.' }, { status: 422 })
    const headers = matrix[headerIndex].map((header) => String(header ?? '').trim())
    const rows: Row[] = matrix.slice(headerIndex + 1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? null])))
    const holdings = rows.map((row) => {
      const name = String(valueFor(row, ['stockname', 'name', 'security', 'symbol', 'ticker']) ?? '').trim()
      const isin = clean(valueFor(row, ['isin']))
      const quantity = positive(valueFor(row, ['quantity', 'qty', 'units', 'holdingquantity']))
      const averagePrice = positive(valueFor(row, ['averagebuyprice', 'avgprice', 'buyprice', 'averageprice', 'costprice']))
      const currentPrice = positive(valueFor(row, ['closingprice', 'currentprice', 'ltp', 'marketprice', 'lastprice']))
      const currentValue = positive(valueFor(row, ['closingvalue', 'currentvalue', 'marketvalue', 'value']))
      const value = currentValue ?? (currentPrice && quantity ? currentPrice * quantity : averagePrice && quantity ? averagePrice * quantity : null)
      const pnlAmount = numberValue(valueFor(row, ['unrealisedpl', 'unrealizedpl', 'pnl', 'profitloss']))
      return { symbol: isin || name, name, quantity, averagePrice, currentPrice, value, sector: sectorFor(name), assetClass: 'Equity', pnl: pnlAmount != null ? pnlAmount : averagePrice && currentPrice ? ((currentPrice - averagePrice) / averagePrice) * 100 : null }
    }).filter((holding) => holding.name && holding.value != null && holding.value > 0 && holding.quantity != null)
    if (!holdings.length) return NextResponse.json({ error: 'The holdings table was found, but no valid positions could be read.' }, { status: 422 })

    const totalValue = holdings.reduce((sum, holding) => sum + (holding.value ?? 0), 0)
    const enriched = holdings.map((holding) => ({ ...holding, value: holding.value as number, weight: ((holding.value as number) / totalValue) * 100 }))
    const largest = Math.max(...enriched.map((holding) => holding.weight))
    const sectorWeights = new Map<string, number>()
    const classWeights = new Map<string, number>()
    enriched.forEach((holding) => { sectorWeights.set(holding.sector, (sectorWeights.get(holding.sector) ?? 0) + holding.weight); classWeights.set(holding.assetClass, (classWeights.get(holding.assetClass) ?? 0) + holding.weight) })
    const dataQuality = Math.round((enriched.length / Math.max(rows.length, 1)) * 100)
    const concentration = Math.max(0, 100 - largest * 1.2)
    const diversification = Math.min(100, new Set(enriched.map((holding) => holding.sector)).size * 18 + Math.min(enriched.length, 8) * 5)
    const score = Math.round(concentration * .3 + diversification * .25 + dataQuality * .2 + (enriched.filter((holding) => holding.pnl != null).length / enriched.length * 100) * .15 + (classWeights.size > 1 ? 100 : 55) * .1)
    const warnings = [largest > 30 ? `Largest holding is ${largest.toFixed(1)}% of the portfolio; one company can dominate outcomes.` : '', [...sectorWeights.values()].some((value) => value > 45) ? 'One sector contributes more than 45% of portfolio value.' : '', enriched.length < 6 ? 'The portfolio has fewer than six holdings, so single-name risk is elevated.' : '', dataQuality < 80 ? 'Some rows were skipped or key fields were missing; verify the source data before acting.' : ''].filter(Boolean)
    const supabase = await createClient()
    const { data: portfolio, error: portfolioError } = await supabase.from('portfolios').insert({ user_id: user.id, name: 'Imported portfolio' }).select('id').single()
    if (portfolioError || !portfolio) return NextResponse.json({ error: 'The workbook was analyzed but could not be saved to your private portfolio.' }, { status: 500 })
    const { error: importError } = await supabase.from('portfolio_imports').insert({ portfolio_id: portfolio.id, user_id: user.id, filename: file.name, source_type: 'xlsx_statement', status: 'processed', row_count: enriched.length })
    const { error: holdingError } = await supabase.from('holdings').insert(enriched.map((holding) => ({ portfolio_id: portfolio.id, user_id: user.id, symbol: holding.symbol, name: holding.name, asset_type: 'equity', quantity: holding.quantity, average_price: holding.averagePrice, current_price: holding.currentPrice, invested_value: holding.averagePrice && holding.quantity ? holding.averagePrice * holding.quantity : null, current_value: holding.value, data_status: 'verified_statement', as_of: new Date().toISOString() })))
    await supabase.from('audit_events').insert({ user_id: user.id, event_type: 'portfolio_import_processed', metadata: { filename: file.name, holdings: enriched.length, importError: importError?.message ?? null, holdingError: holdingError?.message ?? null } })
    if (importError || holdingError) return NextResponse.json({ error: 'The workbook was analyzed but could not be fully saved. Please retry the import.' }, { status: 500 })
    return NextResponse.json({ portfolioId: portfolio.id, score, totalValue, holdings: enriched, strengths: [enriched.length >= 8 ? 'The portfolio has a broad list of positions to review.' : 'You have a clear, manageable list of holdings to review.', 'The statement includes closing values and quantities, so position sizing can be assessed.'], improvements: [largest > 25 ? 'Reduce dependence on the largest position gradually and only with a written thesis.' : 'Set target position sizes based on conviction and risk.', sectorWeights.size < 4 ? 'Review diversification across sectors instead of adding companies that move together.' : 'Review whether each sector exposure is intentional.', 'Add a live data refresh before making decisions; this file is a dated snapshot.'], avoid: ['Avoid averaging down automatically just because a price has fallen.', 'Avoid adding a new holding solely because it is trending or recommended online.', largest > 25 ? 'Avoid allowing one position to become an accidental portfolio proxy.' : 'Avoid changing allocations without checking the original investment thesis.'], warnings, exposures: [...sectorWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value })), dataQuality, disclaimer: 'This is educational portfolio analysis, not financial advice. Imported values are treated as a dated snapshot; verify prices, taxes, liquidity, issuer quality, and your own time horizon before making decisions.' })
  } catch (error) { console.error('[v0] Portfolio workbook analysis failed', error); return NextResponse.json({ error: 'The workbook could not be read. Check that it is a valid .xlsx file.' }, { status: 500 }) }
}
