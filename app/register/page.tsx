'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-3xl font-black text-white">Join Sikarwar</h1>
          <p className="text-gray-500 mt-1">Create your account and start winning</p>
        </div>

        <form onSubmit={submit} className="card p-8 space-y-5">
          {error && (
            <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Full Name</label>
            <input
              type="text" required
              className="input-dark"
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Email</label>
            <input
              type="email" required
              className="input-dark"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Password</label>
            <input
              type="password" required minLength={6}
              className="input-dark"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 rounded-xl text-base font-black disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account & Play 🎰'}
          </button>
          <p className="text-center text-gray-600 text-sm">
            Already have an account? <Link href="/login" className="text-gold-400 font-bold hover:underline">Login</Link>
          </p>
          <p className="text-center text-gray-700 text-xs">By registering you confirm you are 18+</p>
        </form>
      </div>
    </div>
  )
}
