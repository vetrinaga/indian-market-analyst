import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 10 * 1024 * 1024

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required to review a private policy.' }, { status: 401 })

  const form = await request.formData()
  const insurer = String(form.get('insurer') ?? 'Other Indian insurer').slice(0, 80)
  const policyNumber = String(form.get('policyNumber') ?? '').replace(/[^a-zA-Z0-9]/g, '').slice(-4)
  const document = form.get('document')
  if (!(document instanceof File) && !policyNumber) return NextResponse.json({ error: 'Enter a policy number or upload a policy document.' }, { status: 400 })
  if (document instanceof File && document.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Policy documents must be 10 MB or smaller.' }, { status: 413 })

  let storagePath: string | null = null
  if (document instanceof File) {
    const allowed = document.type === 'application/pdf' || document.type.startsWith('image/') || document.type.includes('word') || /\.(pdf|doc|docx)$/i.test(document.name)
    if (!allowed) return NextResponse.json({ error: 'Upload a PDF, DOCX, or image policy document.' }, { status: 400 })
    const blob = await put(`signal-radar/insurance/${user.id}/${crypto.randomUUID()}-${document.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`, document, { access: 'private', addRandomSuffix: false })
    storagePath = blob.pathname
  }

  const policy = {
    insurer,
    policyType: 'Needs document extraction',
    status: storagePath ? 'document_received' : 'api_unavailable',
    source: storagePath ? 'Private document upload; insurer verification pending' : 'No approved insurer API connected',
    benefits: ['Coverage limit and insured members', 'Premium, renewal date, and policy term', 'Riders, waiting periods, and claim conditions'],
    exclusions: ['Permanent exclusions and sub-limits', 'Items requiring insurer confirmation'],
    pros: ['Plain-English summary separates confirmed details from missing information', 'Policy number is never stored in full'],
    cons: ['A policy number alone cannot safely reveal coverage', 'Insurer API access requires official onboarding and customer consent'],
    missing: storagePath ? ['Run document extraction next', 'Confirm policy status with the insurer'] : ['Upload the policy schedule or wording', 'Registered mobile/DOB/OTP verification for live lookup'],
  }

  const { error } = await supabase.from('insurance_policies').insert({ user_id: user.id, insurer, policy_number_last4: policyNumber || null, status: policy.status, verification_source: storagePath ? 'document_upload' : 'api_unavailable', policy_summary: policy, storage_path: storagePath })
  await supabase.from('audit_events').insert({ user_id: user.id, event_type: 'insurance_policy_review_requested', metadata: { insurer, hasDocument: Boolean(storagePath), policyNumberLast4: policyNumber || null } })
  if (error) return NextResponse.json({ error: 'The policy was received but could not be saved securely.' }, { status: 500 })
  return NextResponse.json({ policy, notice: storagePath ? 'Document stored privately. Extraction is ready for the next step.' : 'No official insurer API is connected, so upload the policy document for analysis.' })
}
