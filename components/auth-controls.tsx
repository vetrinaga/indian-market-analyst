'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function AuthControls() {
  const [email, setEmail] = useState<string | null>(null)
  useEffect(() => { createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)) }, [])
  if (!email) return <a href="/auth/login" className="rounded-lg border border-input bg-card px-3.5 py-2 text-xs font-semibold text-primary shadow-sm hover:-translate-y-px hover:bg-muted">Sign in</a>
  return <div className="flex items-center gap-2"><span className="hidden max-w-32 truncate text-[11px] text-muted-foreground sm:block">{email}</span><button onClick={async () => { await createClient().auth.signOut(); window.location.href = '/auth/login' }} className="rounded-lg border border-input bg-card px-3.5 py-2 text-xs font-semibold text-primary shadow-sm hover:-translate-y-px hover:bg-muted">Sign out</button></div>
}
