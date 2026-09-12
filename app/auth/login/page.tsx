'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const { error } = await createClient().auth.signInWithPassword({ email, password }); if (error) setError(error.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid email or password.'); else router.push('/'); setLoading(false) }
  return <main className="grid min-h-screen place-items-center bg-background px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-teal-700">Signal / India</div><h1 className="mt-2 text-2xl font-semibold text-primary">Sign in securely</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Access your private portfolio workspace.</p><label className="mt-6 block text-xs font-medium">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></label><label className="mt-4 block text-xs font-medium">Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></label>{error && <p className="mt-3 text-xs text-destructive">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Signing in…' : 'Sign in'}</button><a href="/auth/forgot-password" className="mt-4 block text-center text-xs underline">Forgot password?</a><a href="/auth/sign-up" className="mt-3 block text-center text-xs underline">Create an account</a></form></main>
}
