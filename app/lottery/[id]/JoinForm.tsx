'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  lotteryId: string
  ticketPrice: number
  upiId: string
  qrImage: string
  loggedIn: boolean
}

export default function JoinForm({ lotteryId, ticketPrice, upiId, qrImage, loggedIn }: Props) {
  const [balance, setBalance] = useState<number | null>(null)
  const [utr, setUtr] = useState('')
  const [useUpi, setUseUpi] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [fromWallet, setFromWallet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loggedIn) return
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.user) setBalance(d.user.balance ?? 0)
    })
  }, [loggedIn])

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const payFromWallet = async () => {
    setLoading(true); setError('')
    const res = await fetch(`/api/lotteries/${lotteryId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payFromWallet: true }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setFromWallet(true)
    setSubmitted(true)
    router.refresh()
  }

  const submitUtr = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
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
      <div className="rounded-2xl border border-white/8 p-6 text-center">
        <div className="text-3xl mb-3">🔐</div>
        <div className="text-white font-bold text-lg mb-1">Login to Join</div>
        <div className="text-gray-500 text-sm mb-4">Create an account to buy tickets</div>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-purple px-5 py-2.5 text-sm rounded-xl">Login</Link>
          <Link href="/register" className="btn-gold px-5 py-2.5 text-sm rounded-xl">Register</Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        {fromWallet ? (
          <>
            <div className="text-green-400 font-black text-xl">Ticket Purchased!</div>
            <div className="text-gray-400 text-sm mt-2">₹{ticketPrice.toLocaleString('en-IN')} deducted from your wallet.</div>
            <a href="/tickets" className="btn-gold inline-block mt-4 px-6 py-2.5 rounded-xl text-sm font-black">
              View My Tickets →
            </a>
          </>
        ) : (
          <>
            <div className="text-green-400 font-black text-xl">UTR Submitted!</div>
            <div className="text-gray-400 text-sm mt-2">
              Admin will verify your payment shortly.{' '}
              <a href="/tickets" className="text-gold-400 font-bold">Check My Tickets</a>
            </div>
          </>
        )}
      </div>
    )
  }

  const hasEnough = balance !== null && balance >= ticketPrice

  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      {/* Price header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <span className="text-white font-black text-lg">Buy Ticket</span>
        <span className="text-gold-400 font-black text-xl">₹{ticketPrice.toLocaleString('en-IN')}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Wallet balance */}
        <div className={`rounded-xl p-3.5 flex items-center justify-between ${hasEnough ? 'bg-green-500/8 border border-green-500/20' : 'bg-white/3 border border-white/8'}`}>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Wallet Balance</div>
            <div className={`font-black text-lg ${hasEnough ? 'text-green-400' : 'text-white'}`}>
              {balance === null ? '...' : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
          </div>
          {!hasEnough && balance !== null && (
            <Link href="/wallet" className="text-xs bg-white/8 hover:bg-white/12 text-gray-300 px-3 py-1.5 rounded-lg transition-colors font-semibold">
              + Add Money
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">{error}</div>
        )}

        {/* Pay from wallet CTA */}
        {hasEnough && !useUpi && (
          <>
            <button
              onClick={payFromWallet}
              disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-black text-base disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay ₹${ticketPrice.toLocaleString('en-IN')} from Wallet`}
            </button>
            <button
              onClick={() => setUseUpi(true)}
              className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1"
            >
              Pay via UPI instead →
            </button>
          </>
        )}

        {/* Not enough balance — show UPI or top up */}
        {!hasEnough && balance !== null && !useUpi && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 text-center">
              You need ₹{(ticketPrice - balance).toLocaleString('en-IN')} more.{' '}
              <Link href="/wallet" className="text-gold-400 font-bold">Top up wallet</Link>
              {' '}or pay via UPI below.
            </div>
            <button onClick={() => setUseUpi(true)} className="btn-gold w-full py-3 rounded-xl font-black text-sm">
              Pay via UPI →
            </button>
          </div>
        )}

        {/* Loading state */}
        {balance === null && loggedIn && (
          <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
        )}

        {/* UPI form */}
        {useUpi && (
          <div className="space-y-4">
            {hasEnough && (
              <button onClick={() => setUseUpi(false)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                ← Use wallet instead
              </button>
            )}

            {/* Step 1: Pay */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <div className="text-xs text-gray-400 font-bold mb-3 uppercase tracking-wide">Step 1 — Pay ₹{ticketPrice.toLocaleString('en-IN')}</div>
              {qrImage && (
                <div className="flex justify-center mb-3">
                  <div className="bg-white p-2 rounded-xl">
                    <img src={qrImage} alt="QR Code" className="w-36 h-36 object-contain" />
                  </div>
                </div>
              )}
              {upiId && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/30 rounded-xl px-3 py-2 text-white font-mono text-sm">{upiId}</div>
                  <button onClick={copyUpi} className="btn-gold px-3 py-2 text-xs rounded-lg whitespace-nowrap">
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              )}
              {!upiId && !qrImage && <div className="text-gray-600 text-sm text-center">UPI not set by admin yet</div>}
            </div>

            {/* Step 2: UTR */}
            <form onSubmit={submitUtr} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1.5 block">Step 2 — Enter UTR</label>
                <input
                  required
                  className="input-dark font-mono tracking-wider"
                  placeholder="12-digit UTR number"
                  value={utr}
                  onChange={e => setUtr(e.target.value)}
                  maxLength={20}
                />
                <div className="text-gray-600 text-xs mt-1">Found in your UPI app under transaction history</div>
              </div>
              <button type="submit" disabled={loading || !utr.trim()} className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40">
                {loading ? 'Submitting...' : 'Submit UTR & Get Ticket 🎟️'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
