'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setReady(Boolean(data.session)))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirmation) return setError('Passwords do not match.')
    setLoading(true)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    if (updateError) setError(updateError.message.toLowerCase().includes('weak') ? 'Choose a stronger password.' : 'We could not update your password. Request a new link and try again.')
    else { setMessage('Your password has been updated.'); setTimeout(() => router.push('/'), 900) }
    setLoading(false)
  }

  if (!ready) return <main className="grid min-h-screen place-items-center bg-background px-5"><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center"><h1 className="text-xl font-semibold text-primary">Reset link required</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Open the password reset link from your email to continue.</p><a href="/auth/forgot-password" className="mt-5 inline-block text-sm font-semibold underline">Request a new link</a></div></main>

  return <main className="grid min-h-screen place-items-center bg-background px-5"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="font-mono text-[10px] uppercase tracking-[.18em] text-teal-700">Signal / India</div><h1 className="mt-2 text-2xl font-semibold text-primary">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Use a unique password with at least 8 characters.</p><label className="mt-6 block text-xs font-medium">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label><label className="mt-4 block text-xs font-medium">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label>{error && <p role="alert" className="mt-3 text-xs text-destructive">{error}</p>}{message && <p role="status" className="mt-3 text-xs text-emerald-700">{message}</p>}<button disabled={loading} className="mt-5 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{loading ? 'Updating…' : 'Update password'}</button></form></main>
}
