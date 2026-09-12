'use client'

import { createClient } from '@/lib/supabase/client'
import { FormEvent, useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    const redirectTo = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback?next=/auth/reset-password`
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email, { redirectTo })
    if (resetError) {
      setError(resetError.status === 429 ? 'Too many requests. Try again later.' : 'We could not start password recovery. Please try again.')
    } else {
      setMessage('If an account matches that email, a password reset link has been sent.')
    }
    setLoading(false)
  }

  return <main className="grid min-h-screen place-items-center bg-background px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-teal-700">Signal / India</div><h1 className="mt-2 text-2xl font-semibold text-primary">Reset your password</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">We&apos;ll send a secure recovery link if an account matches your email.</p><label className="mt-6 block text-xs font-medium">Email<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>{error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}{message && <p role="status" className="mt-3 text-xs text-emerald-700">{message}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Sending…' : 'Send reset link'}</button><a href="/auth/login" className="mt-4 block text-center text-xs underline">Return to sign in</a></form></main>
}
