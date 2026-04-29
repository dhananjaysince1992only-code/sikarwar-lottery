'use client'
import { useState } from 'react'
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
  userBet: { option: string; amount: number } | null
  showClaimOnly: boolean
  userPayout: number
}

export default function BetForm({ questionId, isOpen, loggedIn, upiId, qrImage, optionA, optionB, userBet, showClaimOnly, userPayout }: Props) {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null)
  const [amount, setAmount] = useState('')
  const [utr, setUtr] = useState('')
  const [claimUpi, setClaimUpi] = useState('')
  const [step, setStep] = useState<'select' | 'pay' | 'done'>('select')
  const [claimed, setClaimed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const submitBet = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch(`/api/predictions/${questionId}/bet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: selectedOption, amount: parseFloat(amount), utrNumber: utr }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    setStep('done')
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

  if (showClaimOnly) {
    if (claimed) return <div className="text-green-400 text-sm font-bold mt-3">✅ Claim submitted! Admin will transfer soon.</div>
    return (
      <form onSubmit={claim} className="mt-4 space-y-2">
        <input required className="input-dark text-sm py-2" placeholder="Enter UPI ID for payout" value={claimUpi} onChange={e => setClaimUpi(e.target.value)} />
        {error && <div className="text-red-400 text-xs">{error}</div>}
        <button type="submit" disabled={loading} className="btn-gold w-full py-2.5 rounded-xl text-sm font-black">
          {loading ? '...' : 'Claim ₹' + userPayout.toLocaleString('en-IN')}
        </button>
      </form>
    )
  }

  if (!loggedIn) {
    return (
      <div className="card p-6 text-center">
        <div className="text-3xl mb-3">🔐</div>
        <div className="text-white font-bold mb-3">Login to Place Bet</div>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-purple px-5 py-2.5 text-sm rounded-xl">Login</Link>
          <Link href="/register" className="btn-gold px-5 py-2.5 text-sm rounded-xl">Register</Link>
        </div>
      </div>
    )
  }

  if (userBet) {
    return (
      <div className="card p-5 border-purple-700/40">
        <div className="text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-white font-bold">Bet Placed</div>
          <div className="text-gray-500 text-sm mt-1">
            You bet <span className="text-gold-400 font-bold">₹{userBet.amount}</span> on{' '}
            <span className={`font-bold ${userBet.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>
              {userBet.option === 'A' ? optionA : optionB}
            </span>
          </div>
          <div className="text-gray-700 text-xs mt-2">Waiting for market to resolve...</div>
        </div>
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="card p-6 border-green-500/30 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-green-400 font-black text-lg">Bet Submitted!</div>
        <div className="text-gray-400 text-sm mt-2">Admin will verify your payment. Check back after verification.</div>
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-5">
      <h3 className="text-white font-black text-lg">Place Your Bet</h3>

      {step === 'select' && (
        <div className="space-y-4">
          {/* Option selector */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Choose your outcome</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedOption('A')}
                className={`p-4 rounded-xl border-2 text-left transition-all font-bold ${
                  selectedOption === 'A'
                    ? 'border-green-500 bg-green-500/15 text-green-400'
                    : 'border-gray-800 text-gray-400 hover:border-green-700'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">Option A</div>
                {optionA}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOption('B')}
                className={`p-4 rounded-xl border-2 text-left transition-all font-bold ${
                  selectedOption === 'B'
                    ? 'border-red-500 bg-red-500/15 text-red-400'
                    : 'border-gray-800 text-gray-400 hover:border-red-700'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">Option B</div>
                {optionB}
              </button>
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Amount (₹)</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {[50, 100, 250, 500, 1000].map(a => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${amount === String(a) ? 'border-gold-500 bg-gold-500/15 text-gold-400' : 'border-gray-800 text-gray-500 hover:border-gray-600'}`}>
                  ₹{a}
                </button>
              ))}
            </div>
            <input
              type="number" min="10"
              className="input-dark"
              placeholder="Or enter custom amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <button
            type="button"
            disabled={!selectedOption || !amount || parseFloat(amount) <= 0}
            onClick={() => setStep('pay')}
            className="btn-gold w-full py-3 rounded-xl font-black disabled:opacity-40"
          >
            Continue to Pay →
          </button>
        </div>
      )}

      {step === 'pay' && (
        <form onSubmit={submitBet} className="space-y-4">
          {/* Summary */}
          <div className="bg-casino-950 rounded-xl p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Your pick</span>
              <span className={`font-bold ${selectedOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                {selectedOption === 'A' ? optionA : optionB}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount</span>
              <span className="text-white font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Pay via UPI */}
          <div className="space-y-3">
            <div className="text-gold-400 font-black text-sm">Pay ₹{parseFloat(amount).toLocaleString('en-IN')} to:</div>
            {qrImage && (
              <div className="flex justify-center">
                <div className="bg-white p-2 rounded-xl w-36 h-36 flex items-center justify-center">
                  <img src={qrImage} alt="QR" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
            {upiId && (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-casino-800 rounded-xl px-3 py-2 text-white font-mono text-sm">{upiId}</div>
                <button type="button" onClick={copyUpi} className="btn-gold px-3 py-2 text-xs rounded-lg">
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* UTR */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Enter UTR after paying</label>
            <input required className="input-dark font-mono tracking-wider" placeholder="12-digit UTR number" value={utr} onChange={e => setUtr(e.target.value)} />
          </div>

          {error && <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-3 py-2 text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('select')} className="flex-1 py-3 rounded-xl border border-gray-800 text-gray-400 font-bold text-sm hover:border-gray-700">
              ← Back
            </button>
            <button type="submit" disabled={loading || !utr.trim()} className="flex-1 btn-gold py-3 rounded-xl font-black disabled:opacity-40">
              {loading ? '...' : 'Submit Bet'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
