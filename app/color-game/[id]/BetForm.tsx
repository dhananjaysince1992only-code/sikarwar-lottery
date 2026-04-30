'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const COLOR_CONFIG = {
  red: { label: 'Red', bg: 'bg-red-600/20', border: 'border-red-500/50', activeBg: 'bg-red-600/40', text: 'text-red-400', dot: 'bg-red-500', multiplier: 1.9 },
  green: { label: 'Green', bg: 'bg-green-600/20', border: 'border-green-500/50', activeBg: 'bg-green-600/40', text: 'text-green-400', dot: 'bg-green-500', multiplier: 1.9 },
  violet: { label: 'Violet', bg: 'bg-violet-600/20', border: 'border-violet-500/50', activeBg: 'bg-violet-600/40', text: 'text-violet-400', dot: 'bg-violet-500', multiplier: 4.5 },
}

interface Props {
  roundId: string
  upiId: string
  qrImage: string
  loggedIn: boolean
  userBet: { color: string; amount: number; utrStatus: string; payout: number | null; payoutStatus: string } | null
  isResolved: boolean
  result: string
}

export default function BetForm({ roundId, upiId, qrImage, loggedIn, userBet, isResolved, result }: Props) {
  const router = useRouter()
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [step, setStep] = useState<'pick' | 'pay'>('pick')
  const [amount, setAmount] = useState('')
  const [utr, setUtr] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [claimUpi, setClaimUpi] = useState('')
  const [claimed, setClaimed] = useState(false)

  const presets = [50, 100, 200, 500, 1000]
  const cfg = selectedColor ? COLOR_CONFIG[selectedColor as keyof typeof COLOR_CONFIG] : null
  const potentialWin = cfg && amount ? Math.round(parseFloat(amount) * cfg.multiplier * 100) / 100 : 0

  const handleClaim = async () => {
    if (!claimUpi.trim()) return
    setLoading(true)
    const res = await fetch(`/api/color-game/${roundId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId: claimUpi }),
    })
    setLoading(false)
    if ((await res.json()).ok) setClaimed(true)
  }

  // Show result + payout claim for winner
  if (userBet && isResolved) {
    const userWon = userBet.color === result
    const betCfg = COLOR_CONFIG[userBet.color as keyof typeof COLOR_CONFIG]
    return (
      <div className={`card p-5 text-center ${userWon ? 'border-gold-500/40 bg-gold-500/5' : 'border-gray-800'}`}>
        {userWon ? (
          <>
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-gold-400 font-black text-xl">You Won!</div>
            <div className="text-white font-black text-3xl mt-1">₹{userBet.payout?.toLocaleString('en-IN') ?? '—'}</div>
            <div className="text-gray-500 text-xs mt-1 mb-4">Your ₹{userBet.amount} bet × {betCfg.multiplier}×</div>
            {!claimed && userBet.payoutStatus === 'UNPAID' && (
              <div className="space-y-2">
                <input
                  className="input-dark text-sm"
                  placeholder="Enter your UPI ID to receive payout"
                  value={claimUpi}
                  onChange={e => setClaimUpi(e.target.value)}
                />
                <button onClick={handleClaim} disabled={loading} className="btn-gold w-full py-3 rounded-xl font-black">
                  {loading ? '...' : 'Claim Payout 💰'}
                </button>
              </div>
            )}
            {(claimed || userBet.payoutStatus === 'CLAIMED') && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 text-green-400 text-sm">
                ✓ Claim submitted — admin will transfer within 24 hours
              </div>
            )}
            {userBet.payoutStatus === 'PAID' && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-3 text-green-400 font-bold">
                ✓ Paid!
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-3xl mb-2">😔</div>
            <div className="text-gray-400 font-bold">Better luck next time</div>
            <div className="text-gray-600 text-sm mt-1">
              You bet ₹{userBet.amount} on <span className={betCfg.text}>{betCfg.label}</span>
            </div>
          </>
        )}
      </div>
    )
  }

  // Already placed a bet, waiting for approval
  if (userBet && !isResolved) {
    const betCfg = COLOR_CONFIG[userBet.color as keyof typeof COLOR_CONFIG]
    return (
      <div className="card p-5 text-center border-violet-500/20">
        <div className="text-3xl mb-2">⏳</div>
        <div className="text-white font-black">Bet Placed!</div>
        <div className="text-gray-400 text-sm mt-2">
          ₹{userBet.amount} on <span className={betCfg.text}>{betCfg.label}</span>
        </div>
        <div className={`mt-3 text-xs px-3 py-1.5 rounded-full inline-block ${
          userBet.utrStatus === 'APPROVED' ? 'badge-approved' :
          userBet.utrStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
        }`}>
          Payment: {userBet.utrStatus}
        </div>
        {userBet.utrStatus === 'APPROVED' && (
          <div className="text-green-400 text-xs mt-2">✓ Confirmed — waiting for round result</div>
        )}
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="card p-5 text-center">
        <div className="text-2xl mb-3">🔐</div>
        <div className="text-white font-bold mb-1">Login to Play</div>
        <a href="/register" className="btn-gold block mt-3 py-3 rounded-xl font-black">Register & Play</a>
        <a href="/login" className="block mt-2 text-sm text-gray-400 hover:text-white transition-colors">Already have account? Login</a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="card p-5 text-center border-green-500/20 bg-green-500/5">
        <div className="text-4xl mb-2">✅</div>
        <div className="text-green-400 font-black text-lg">Bet Submitted!</div>
        <div className="text-gray-400 text-sm mt-2">Admin will verify your payment shortly.</div>
        <button onClick={() => router.refresh()} className="btn-gold mt-4 px-6 py-2.5 rounded-xl text-sm font-black">
          Refresh
        </button>
      </div>
    )
  }

  if (step === 'pick') {
    return (
      <div className="card p-5">
        <h3 className="text-gold-400 font-black text-lg mb-4">Pick Your Color</h3>

        {/* Color buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {Object.entries(COLOR_CONFIG).map(([color, c]) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`relative p-4 rounded-2xl border-2 transition-all text-center ${
                selectedColor === color
                  ? `${c.activeBg} ${c.border} scale-105 shadow-lg`
                  : `${c.bg} border-gray-800 hover:${c.border}`
              }`}
            >
              <div className={`w-10 h-10 ${c.dot} rounded-full mx-auto mb-2 ${selectedColor === color ? 'shadow-lg ring-2 ring-white/30' : ''}`} />
              <div className={`font-black text-sm ${c.text}`}>{c.label}</div>
              <div className="text-white font-black">{c.multiplier}×</div>
              {selectedColor === color && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs font-black">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Amount */}
        {selectedColor && (
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">Bet Amount (₹)</label>
              <input
                type="number"
                className="input-dark text-lg font-bold"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {presets.map(p => (
                  <button
                    key={p}
                    onClick={() => setAmount(String(p))}
                    className="text-xs bg-casino-800 border border-gray-700 hover:border-violet-500 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>

            {potentialWin > 0 && (
              <div className={`${cfg?.bg} border ${cfg?.border} rounded-xl p-3 text-center`}>
                <div className="text-gray-400 text-xs">Potential Win</div>
                <div className={`font-black text-2xl ${cfg?.text}`}>₹{potentialWin.toLocaleString('en-IN')}</div>
              </div>
            )}

            <button
              onClick={() => {
                if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return }
                setError('')
                setStep('pay')
              }}
              className="btn-gold w-full py-3.5 rounded-xl font-black text-base"
            >
              Proceed to Pay →
            </button>
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
          </div>
        )}
      </div>
    )
  }

  // Pay step
  return (
    <div className="card p-5">
      <button onClick={() => setStep('pick')} className="text-gray-600 hover:text-gray-400 text-sm mb-4 flex items-center gap-1">
        ← Change color
      </button>

      <div className="flex items-center gap-3 mb-5 p-3 bg-casino-950 rounded-xl">
        <div className={`w-10 h-10 ${cfg?.dot} rounded-full`} />
        <div>
          <div className={`font-black ${cfg?.text}`}>{cfg?.label}</div>
          <div className="text-white font-black">₹{parseFloat(amount).toLocaleString('en-IN')} → Win ₹{potentialWin.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {qrImage && (
        <div className="text-center mb-4">
          <div className="text-gray-400 text-xs mb-2 uppercase tracking-widest">Scan QR to Pay</div>
          <img src={qrImage} alt="QR Code" className="w-36 h-36 object-contain bg-white rounded-xl p-2 mx-auto" />
        </div>
      )}

      {upiId && (
        <div className="bg-casino-950 rounded-xl px-4 py-3 text-center mb-4">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">UPI ID</div>
          <div className="text-white font-bold font-mono">{upiId}</div>
          <div className="text-gold-400 font-black mt-1">₹{parseFloat(amount).toLocaleString('en-IN')}</div>
        </div>
      )}

      <div>
        <label className="text-gray-400 text-sm mb-1.5 block">UTR / Transaction ID</label>
        <input
          className="input-dark"
          placeholder="12-digit UTR number from your UPI app"
          value={utr}
          onChange={e => setUtr(e.target.value)}
        />
      </div>

      {error && <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2.5 text-red-400 text-sm mt-3">{error}</div>}

      <button
        onClick={async () => {
          if (!utr.trim()) { setError('Enter UTR number'); return }
          setLoading(true)
          setError('')
          const res = await fetch(`/api/color-game/${roundId}/bet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ color: selectedColor, amount: parseFloat(amount), utrNumber: utr }),
          })
          const data = await res.json()
          setLoading(false)
          if (data.error) { setError(data.error); return }
          setSuccess(true)
        }}
        disabled={loading}
        className="btn-gold w-full py-3.5 rounded-xl font-black text-base mt-4 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Bet 🎰'}
      </button>
    </div>
  )
}
