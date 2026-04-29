'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface Props {
  lotteryId: string
  ticketPrice: number
  upiId: string
  qrImage: string
  loggedIn: boolean
}

export default function JoinForm({ lotteryId, ticketPrice, upiId, qrImage, loggedIn }: Props) {
  const [utr, setUtr] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/lotteries/${lotteryId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utrNumber: utr }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setSubmitted(true)
    router.refresh()
  }

  if (!loggedIn) {
    return (
      <div className="card p-6 text-center border-gold-500/30">
        <div className="text-3xl mb-3">🔐</div>
        <div className="text-white font-bold text-lg mb-2">Login to Join</div>
        <div className="text-gray-500 text-sm mb-4">Create an account or login to buy tickets</div>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-purple px-5 py-2.5 text-sm">Login</Link>
          <Link href="/register" className="btn-gold px-5 py-2.5 text-sm rounded-xl">Register</Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="card p-6 border-green-500/30 bg-green-500/5 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-green-400 font-black text-xl">UTR Submitted!</div>
        <div className="text-gray-400 text-sm mt-2">
          Admin will verify your payment shortly. Check <a href="/tickets" className="text-gold-400 font-bold">My Tickets</a> for status.
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-5">
      <h3 className="text-white font-black text-lg">Join This Lottery</h3>

      {/* Step 1: Pay */}
      <div className="bg-casino-950 rounded-xl p-4 border border-purple-900/40">
        <div className="text-gold-400 font-black text-sm mb-3">Step 1 — Pay ₹{ticketPrice.toLocaleString('en-IN')}</div>

        {qrImage && (
          <div className="flex justify-center mb-3">
            <div className="bg-white p-2 rounded-xl">
              <img src={qrImage} alt="QR Code" className="w-40 h-40 object-contain" />
            </div>
          </div>
        )}

        {upiId && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-casino-800 rounded-xl px-3 py-2 text-white font-mono text-sm">{upiId}</div>
            <button onClick={copyUpi} className="btn-gold px-3 py-2 text-xs rounded-lg whitespace-nowrap">
              {copied ? '✓ Copied' : 'Copy UPI'}
            </button>
          </div>
        )}

        {!upiId && !qrImage && (
          <div className="text-gray-600 text-sm text-center">UPI details not set by admin yet</div>
        )}
      </div>

      {/* Step 2: Enter UTR */}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-gold-400 font-black text-sm block mb-1.5">Step 2 — Enter UTR Number</label>
          <input
            required
            className="input-dark font-mono tracking-wider text-lg"
            placeholder="12-digit UTR number"
            value={utr}
            onChange={e => setUtr(e.target.value)}
            maxLength={20}
          />
          <div className="text-gray-600 text-xs mt-1">Found in your UPI app under transaction details</div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-3 py-2 text-red-400 text-sm">{error}</div>
        )}

        <button type="submit" disabled={loading || !utr.trim()} className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40">
          {loading ? 'Submitting...' : 'Submit UTR & Get My Ticket 🎟️'}
        </button>
      </form>
    </div>
  )
}
