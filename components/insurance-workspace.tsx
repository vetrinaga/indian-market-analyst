'use client'

import { useState } from 'react'
import { FileText, LockKeyhole, Search, ShieldCheck, UploadCloud } from 'lucide-react'

type PolicyResult = {
  insurer: string
  policyType: string
  status: string
  source: string
  benefits: string[]
  exclusions: string[]
  pros: string[]
  cons: string[]
  missing: string[]
}

const demoResult: PolicyResult = {
  insurer: 'Document review ready',
  policyType: 'Policy type will be identified from the document',
  status: 'Needs document extraction',
  source: 'No insurer API connected',
  benefits: ['Coverage limit and insured members', 'Premium, renewal date, and policy term', 'Riders, waiting periods, and claim conditions'],
  exclusions: ['Permanent exclusions and sub-limits', 'Items requiring insurer confirmation'],
  pros: ['Plain-English summary separates confirmed details from missing information', 'Policy number is never stored in full'],
  cons: ['A policy number alone cannot safely reveal coverage', 'Document extraction still needs a human check'],
  missing: ['Upload the policy schedule or wording', 'Registered contact verification for live insurer lookup'],
}

export function InsuranceWorkspace() {
  const [insurer, setInsurer] = useState('LIC')
  const [policyNumber, setPolicyNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<PolicyResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function lookup() {
    setLoading(true)
    setMessage('')
    setResult(null)
    try {
      const body = new FormData()
      body.append('insurer', insurer)
      body.append('policyNumber', policyNumber)
      if (file) body.append('document', file)
      const response = await fetch('/api/insurance/analyze', { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'Insurance analysis unavailable')
      setResult(data.policy)
      setMessage(data.notice ?? 'Analysis complete')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analysis unavailable')
    } finally {
      setLoading(false)
    }
  }

  return <section className="mb-7 rounded-xl border border-border bg-card">
    <div className="flex flex-col justify-between gap-5 border-b border-border p-5 md:flex-row md:items-start">
      <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-primary"><ShieldCheck size={14}/> Insurance intelligence</div><h2 className="text-xl font-semibold tracking-tight text-primary">Understand what your policy actually covers.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">India-first policy review for benefits, exclusions, renewal terms, and missing information. API lookups remain disabled until an insurer grants an approved, consent-based connection.</p></div>
      <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800"><LockKeyhole size={14}/> Consent-first and private</div>
    </div>
    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_1.2fr]">
      <div className="space-y-3"><label className="block text-xs font-semibold text-primary">Insurer<select value={insurer} onChange={(e) => setInsurer(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"><option>LIC</option><option>HDFC Life</option><option>Other Indian insurer</option></select></label><label className="block text-xs font-semibold text-primary">Policy number<span className="mt-1 block text-[11px] font-normal text-muted-foreground">Only the last four characters are retained.</span><input value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="Enter for matching only" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label><button onClick={lookup} disabled={loading || (!policyNumber && !file)} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Search size={14}/>{loading ? 'Reviewing…' : 'Check policy'}</button></div>
      <div><label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-5 text-center"><UploadCloud className="mb-3 text-primary" size={24}/><span className="text-sm font-semibold text-primary">Upload policy document</span><span className="mt-1 text-xs leading-5 text-muted-foreground">PDF, DOCX, or image up to 10 MB. Prefer the policy schedule and wording.</span><input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" /></label>{file && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><FileText size={14}/> {file.name}</div>}</div>
      <div className="rounded-lg border border-border bg-background p-4"><div className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">What you will get</div>{(result ?? demoResult).benefits.slice(0, 3).map((item) => <div key={item} className="mb-2 flex gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-500"/>{item}</div>)}<div className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">{message || 'A live insurer API is not connected. Uploading a document enables a private, evidence-based review.'}</div></div>
    </div>
    {result && <div className="grid gap-4 border-t border-border p-5 md:grid-cols-2 xl:grid-cols-4"><PolicyList title="Benefits" items={result.benefits} tone="good"/><PolicyList title="Exclusions / cautions" items={result.exclusions} tone="risk"/><PolicyList title="Pros" items={result.pros} tone="good"/><PolicyList title="Cons & missing" items={[...result.cons, ...result.missing]} tone="plain"/></div>}
  </section>
}

function PolicyList({ title, items, tone }: { title: string; items: string[]; tone: 'good' | 'risk' | 'plain' }) { const dot = tone === 'risk' ? 'bg-amber-500' : tone === 'good' ? 'bg-teal-500' : 'bg-slate-400'; return <div><h3 className="mb-2 text-xs font-semibold text-primary">{title}</h3><ul className="space-y-2 text-xs leading-5 text-muted-foreground">{items.map((item) => <li key={item} className="flex gap-2"><span className={`mt-2 size-1.5 shrink-0 rounded-full ${dot}`}/>{item}</li>)}</ul></div> }
