'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  questionId: string
  isOpen: boolean
  loggedIn: boolean
  upiId: string
  qrImage: string
  optionA: string
  optionB: string
  userBet: { option: string; amount: number; utrStatus: string } | null
  showClaimOnly: boolean
  userPayout: number
}

export default function BetForm({ questionId, isOpen, loggedIn, upiId, qrImage, optionA, optionB, userBet, showClaimOnly, userPayout }: Props) {
  const [balance, setBalance] = useState<number | null>(null)
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null)
  const [amount, setAmount] = useState('')
  const [utr, setUtr] = useState('')
  const [useUpi, setUseUpi] = useState(false)
  const [claimUpi, setClaimUpi] = useState('')
  const [claimed, setClaimed] = useState(false)
  const [step, setStep] = useState<'select' | 'pay'>('select')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [fromWallet, setFromWallet] = useState(false)
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

  const betAmount = parseFloat(amount) || 0
  const hasEnough = balance !== null && balance >= betAmount && betAmount > 0

  const payWallet = async () => {
    setLoading(true); setError('')
    const res = await fetch(`/api/predictions/${questionId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: selectedOption, amount: betAmount, payFromWallet: true }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setFromWallet(true)
    setDone(true)
    router.refresh()
  }

  const submitUtr = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch(`/api/predictions/${questionId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: selectedOption, amount: betAmount, utrNumber: utr }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setDone(true)
    router.refresh()
  }

  const claim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch(`/api/predictions/${questionId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId: claimUpi }),
    })
    setLoading(false)
    const data = await res.json()
    if (data.ok) setClaimed(true)
    else setError(data.error ?? 'Error')
  }

  // --- Claim payout ---
  if (showClaimOnly) {
    if (claimed) return <div className="text-green-400 text-sm font-bold mt-3 text-center">✅ Claim submitted! Admin will transfer soon.</div>
    return (
      <form onSubmit={claim} className="mt-4 space-y-2">
        <input required className="input-dark text-sm py-2" placeholder="Enter UPI ID for payout" value={claimUpi} onChange={e => setClaimUpi(e.target.value)} />
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 rounded-xl text-sm font-black">
          {loading ? '...' : `Claim ₹${userPayout.toLocaleString('en-IN')}`}
        </button>
      </form>
    )
  }

  // --- Guest ---
  if (!loggedIn) {
    return (
      <div className="rounded-2xl border border-white/8 p-6 text-center">
        <div className="text-3xl mb-3">🔐</div>
        <div className="text-white font-bold mb-3">Login to Bet</div>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-purple px-5 py-2.5 text-sm rounded-xl">Login</Link>
          <Link href="/register" className="btn-gold px-5 py-2.5 text-sm rounded-xl">Register</Link>
        </div>
      </div>
    )
  }

  // --- Already bet ---
  if (userBet) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/2 p-5 text-center">
        <div className="text-2xl mb-2">✅</div>
        <div className="text-white font-bold">Bet Placed</div>
        <div className="text-gray-500 text-sm mt-1">
          <span className="text-gold-400 font-bold">₹{userBet.amount.toLocaleString('en-IN')}</span>
          {' '}on{' '}
          <span className={`font-bold ${userBet.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>
            {userBet.option === 'A' ? optionA : optionB}
          </span>
        </div>
        {userBet.utrStatus === 'PENDING' && (
          <div className="text-yellow-500 text-xs mt-2">⏳ Pending admin verification</div>
        )}
        {userBet.utrStatus === 'APPROVED' && (
          <div className="text-green-500 text-xs mt-2">✓ Confirmed · Waiting for result</div>
        )}
      </div>
    )
  }

  // --- Bet done ---
  if (done) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        {fromWallet ? (
          <>
            <div className="text-green-400 font-black text-lg">Bet Placed!</div>
            <div className="text-gray-400 text-sm mt-1">₹{betAmount.toLocaleString('en-IN')} deducted from your wallet.</div>
          </>
        ) : (
          <>
            <div className="text-green-400 font-black text-lg">Bet Submitted!</div>
            <div className="text-gray-400 text-sm mt-1">Admin will verify your payment shortly.</div>
          </>
        )}
      </div>
    )
  }

  // --- Step: Select option + amount ---
  if (step === 'select') {
    return (
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <span className="text-white font-black text-base">Place Your Bet</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Option selector */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setSelectedOption('A')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${selectedOption === 'A' ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-white/8 text-gray-400 hover:border-green-700/50'}`}>
              <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Option A</div>
              <div className="font-bold text-sm leading-tight">{optionA}</div>
            </button>
            <button onClick={() => setSelectedOption('B')}
              className={`p-3.5 rounded-xl border-2 text-left transition-all ${selectedOption === 'B' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-white/8 text-gray-400 hover:border-red-700/50'}`}>
              <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">Option B</div>
              <div className="font-bold text-sm leading-tight">{optionB}</div>
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Amount (₹)</label>
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {[50, 100, 250, 500, 1000].map(a => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${amount === String(a) ? 'border-yellow-500/60 bg-yellow-500/10 text-yellow-400' : 'border-white/8 text-gray-500 hover:border-white/15'}`}>
                  ₹{a}
                </button>
              ))}
            </div>
            <input type="number" min="10" className="input-dark" placeholder="Or enter custom amount"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          <button
            type="button"
            disabled={!selectedOption || betAmount <= 0}
            onClick={() => setStep('pay')}
            className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // --- Step: Pay ---
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      {/* Header with back */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <button onClick={() => setStep('select')} className="text-gray-600 hover:text-gray-400 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-white font-black text-base">Pay to Confirm</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Summary */}
        <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Betting on</div>
            <div className={`font-bold text-sm ${selectedOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
              {selectedOption === 'A' ? optionA : optionB}
            </div>
          </div>
          <div className="text-gold-400 font-black text-xl">₹{betAmount.toLocaleString('en-IN')}</div>
        </div>

        {/* Wallet balance */}
        <div className={`rounded-xl p-3.5 flex items-center justify-between ${hasEnough ? 'bg-green-500/8 border border-green-500/20' : 'bg-white/3 border border-white/8'}`}>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Wallet Balance</div>
            <div className={`font-black ${hasEnough ? 'text-green-400' : 'text-white'}`}>
              {balance === null ? '...' : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
          {!hasEnough && balance !== null && (
            <Link href="/wallet" className="text-xs bg-white/8 text-gray-300 px-3 py-1.5 rounded-lg font-semibold">
              + Top up
            </Link>
          )}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">{error}</div>}

        {/* Wallet pay button */}
        {hasEnough && !useUpi && (
          <>
            <button onClick={payWallet} disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-black text-base disabled:opacity-50">
              {loading ? 'Placing Bet...' : `Pay ₹${betAmount.toLocaleString('en-IN')} from Wallet`}
            </button>
            <button onClick={() => setUseUpi(true)} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
              Pay via UPI instead →
            </button>
          </>
        )}

        {/* Not enough — offer top up + UPI */}
        {!hasEnough && balance !== null && !useUpi && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 text-center">
              Need ₹{(betAmount - balance).toLocaleString('en-IN')} more.{' '}
              <Link href="/wallet" className="text-gold-400 font-bold">Add money</Link> or pay via UPI.
            </div>
            <button onClick={() => setUseUpi(true)} className="btn-gold w-full py-3 rounded-xl font-black text-sm">
              Pay via UPI →
            </button>
          </div>
        )}

        {/* UPI form */}
        {useUpi && (
          <div className="space-y-3">
            {hasEnough && (
              <button onClick={() => setUseUpi(false)} className="text-xs text-gray-600 hover:text-gray-400">
                ← Use wallet instead
              </button>
            )}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-3">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wide">Pay ₹{betAmount.toLocaleString('en-IN')} to</div>
              {qrImage && (
                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-xl w-32 h-32"><img src={qrImage} alt="QR" className="w-full h-full object-contain" /></div>
                </div>
              )}
              {upiId && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/30 rounded-xl px-3 py-2 text-white font-mono text-sm">{upiId}</div>
                  <button type="button" onClick={copyUpi} className="btn-gold px-3 py-2 text-xs rounded-lg">{copied ? '✓' : 'Copy'}</button>
                </div>
              )}
            </div>

            <form onSubmit={submitUtr} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1.5 block">Enter UTR after paying</label>
                <input required className="input-dark font-mono tracking-wider" placeholder="12-digit UTR" value={utr} onChange={e => setUtr(e.target.value)} />
              </div>
              <button type="submit" disabled={loading || !utr.trim()} className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40">
                {loading ? '...' : 'Submit Bet'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
