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
  showClaimOnly: boolean
  userPayout: number
  poolA: number
  poolB: number
  total: number
  commission: number
}

export default function BetForm({
  questionId, isOpen, loggedIn, upiId, qrImage, optionA, optionB,
  showClaimOnly, userPayout, poolA, poolB, total, commission,
}: Props) {
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

  // Live payout calculation
  function calcPayout(option: 'A' | 'B', amt: number) {
    if (amt <= 0) return null
    const currentPool = option === 'A' ? poolA : poolB
    const newTotal = total + amt
    const newPool = currentPool + amt
    const newPrize = newTotal * (1 - commission / 100)
    const payout = (amt / newPool) * newPrize
    const mult = Math.round((payout / amt) * 100) / 100
    return { payout: Math.round(payout * 100) / 100, mult }
  }

  const earnings = selectedOption && betAmount > 0 ? calcPayout(selectedOption, betAmount) : null

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
    setFromWallet(true); setDone(true)
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
        <input required className="input-dark text-sm py-2" placeholder="Your UPI ID for payout" value={claimUpi} onChange={e => setClaimUpi(e.target.value)} />
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
        <div className="text-white font-bold mb-3">Login to Place a Bet</div>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-purple px-5 py-2.5 text-sm rounded-xl">Login</Link>
          <Link href="/register" className="btn-gold px-5 py-2.5 text-sm rounded-xl">Register</Link>
        </div>
      </div>
    )
  }

  // --- Bet submitted ---
  if (done) {
    return (
      <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        {fromWallet ? (
          <>
            <div className="text-green-400 font-black">Bet Confirmed!</div>
            <div className="text-gray-400 text-sm mt-1">₹{betAmount.toLocaleString('en-IN')} deducted from your wallet instantly.</div>
          </>
        ) : (
          <>
            <div className="text-green-400 font-black">Submitted!</div>
            <div className="text-gray-400 text-sm mt-1">Admin will verify your payment shortly.</div>
          </>
        )}
        <button onClick={() => { setDone(false); setStep('select'); setAmount(''); setSelectedOption(null); setUtr(''); setUseUpi(false) }}
          className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          Place another bet →
        </button>
      </div>
    )
  }

  // --- Step 1: Select ---
  if (step === 'select') {
    return (
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5">
          <span className="text-white font-black">Place a Bet</span>
        </div>
        <div className="p-4 space-y-4">
          {/* Option selector */}
          <div className="grid grid-cols-2 gap-2">
            {[{ key: 'A' as const, label: optionA, color: 'green' }, { key: 'B' as const, label: optionB, color: 'red' }].map(opt => {
              const pool = opt.key === 'A' ? poolA : poolB
              const pct = total > 0 ? Math.round((pool / total) * 100) : 50
              const est = betAmount > 0 ? calcPayout(opt.key, betAmount) : null
              return (
                <button key={opt.key} onClick={() => setSelectedOption(opt.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedOption === opt.key
                      ? opt.color === 'green' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                      : 'border-white/8 hover:border-white/15'
                  }`}>
                  <div className="text-[10px] text-gray-600 mb-1 uppercase tracking-wide">
                    {pct}% chance
                  </div>
                  <div className={`font-bold text-sm leading-tight mb-1 ${selectedOption === opt.key ? (opt.color === 'green' ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                    {opt.label}
                  </div>
                  {est ? (
                    <div className="text-[10px] text-yellow-400 font-bold">→ ₹{est.payout.toLocaleString('en-IN')} ({est.mult}×)</div>
                  ) : (
                    <div className="text-[10px] text-gray-600">{pool > 0 ? `${Math.round(total * (1 - commission / 100) / pool * 100) / 100}× current` : 'First bet'}</div>
                  )}
                </button>
              )
            })}
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
            <input type="number" min="10" className="input-dark" placeholder="Custom amount"
              value={amount} onChange={e => setAmount(e.target.value)} />
          </div>

          {/* Earnings preview */}
          {earnings && selectedOption && (
            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">If {selectedOption === 'A' ? optionA : optionB} wins</div>
                  <div className="text-yellow-400 font-black text-lg">₹{earnings.payout.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-0.5">Multiplier</div>
                  <div className="text-white font-black text-lg">{earnings.mult}×</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-600 mt-1">Estimated based on current pool · changes as others bet</div>
            </div>
          )}

          <button type="button" disabled={!selectedOption || betAmount <= 0}
            onClick={() => setStep('pay')}
            className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40">
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // --- Step 2: Pay ---
  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
        <button onClick={() => setStep('select')} className="text-gray-600 hover:text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-white font-black">Confirm &amp; Pay</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Summary */}
        <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Your pick</span>
            <span className={`font-bold text-sm ${selectedOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
              {selectedOption === 'A' ? optionA : optionB}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Amount</span>
            <span className="text-white font-black">₹{betAmount.toLocaleString('en-IN')}</span>
          </div>
          {earnings && (
            <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
              <span className="text-gray-500 text-xs">If you win</span>
              <span className="text-yellow-400 font-black">₹{earnings.payout.toLocaleString('en-IN')} ({earnings.mult}×)</span>
            </div>
          )}
        </div>

        {/* Wallet balance */}
        <div className={`rounded-xl p-3.5 flex items-center justify-between ${hasEnough ? 'bg-green-500/8 border border-green-500/20' : 'bg-white/3 border border-white/8'}`}>
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Wallet</div>
            <div className={`font-black ${hasEnough ? 'text-green-400' : 'text-white'}`}>
              {balance === null ? '...' : `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
          {!hasEnough && balance !== null && (
            <Link href="/wallet" className="text-xs bg-white/8 text-gray-300 px-3 py-1.5 rounded-lg font-semibold">+ Add</Link>
          )}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-red-400 text-sm">{error}</div>}

        {hasEnough && !useUpi && (
          <>
            <button onClick={payWallet} disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl font-black disabled:opacity-50">
              {loading ? 'Placing...' : `Pay ₹${betAmount.toLocaleString('en-IN')} from Wallet`}
            </button>
            <button onClick={() => setUseUpi(true)} className="w-full text-xs text-gray-600 hover:text-gray-400 transition-colors py-1">
              Pay via UPI instead →
            </button>
          </>
        )}

        {!hasEnough && balance !== null && !useUpi && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 text-center">
              Need ₹{(betAmount - balance).toLocaleString('en-IN')} more.{' '}
              <Link href="/wallet" className="text-gold-400 font-bold">Top up</Link> or pay via UPI.
            </div>
            <button onClick={() => setUseUpi(true)} className="btn-gold w-full py-3 rounded-xl font-black text-sm">Pay via UPI →</button>
          </div>
        )}

        {useUpi && (
          <div className="space-y-3">
            {hasEnough && (
              <button onClick={() => setUseUpi(false)} className="text-xs text-gray-600 hover:text-gray-400">← Use wallet</button>
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
              <input required className="input-dark font-mono tracking-wider" placeholder="12-digit UTR number" value={utr} onChange={e => setUtr(e.target.value)} />
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
