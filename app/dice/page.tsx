'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const HOUSE_EDGE = 0.05

export default function DicePage() {
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState('100')
  const [prediction, setPrediction] = useState<'over' | 'under'>('over')
  const [threshold, setThreshold] = useState(50)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ roll: number; won: boolean; payout: number; multiplier: number } | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<{ roll: number; won: boolean; payout: number; threshold: number; prediction: string }[]>([])

  const winChance = prediction === 'over' ? (100 - threshold) / 100 : threshold / 100
  const multiplier = Math.floor(((1 - HOUSE_EDGE) / winChance) * 100) / 100
  const potentialWin = Math.round(parseFloat(betAmount || '0') * multiplier * 100) / 100

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return }
      setUserId(d.user.id)
      setBalance(d.user.balance)
    })
  }, [])

  const roll = async () => {
    if (!userId) { router.push('/login'); return }
    setLoading(true); setError(''); setResult(null)
    const res = await fetch('/api/dice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: betAmount, prediction, threshold }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    setResult({ roll: d.result, won: d.won, payout: d.payout, multiplier: d.multiplier })
    setBalance(d.newBalance)
    setHistory(h => [{ roll: d.result, won: d.won, payout: d.payout, threshold, prediction }, ...h].slice(0, 20))
  }

  const presets = [50, 100, 200, 500, 1000]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white mb-1">🎲 Dice</h1>
        <p className="text-gray-400 text-sm">Roll over or under your chosen number</p>
      </div>

      {/* Balance */}
      <div className="card p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-gray-500 text-xs uppercase tracking-widest">Balance</div>
          <div className="text-gold-400 font-black text-2xl">₹{(balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <a href="/wallet" className="text-xs text-purple-400 hover:text-purple-300 transition-colors border border-purple-700/40 px-3 py-1.5 rounded-lg">+ Deposit</a>
      </div>

      {/* Result display */}
      <div className="card p-6 mb-6 flex flex-col items-center justify-center min-h-32">
        {!result && !loading && (
          <div className="text-gray-600 text-center">
            <div className="text-5xl mb-2">🎲</div>
            <div className="text-sm">Set your bet and roll!</div>
          </div>
        )}
        {loading && (
          <div className="text-center">
            <div className="text-5xl mb-2 animate-bounce">🎲</div>
            <div className="text-gray-400 text-sm animate-pulse">Rolling...</div>
          </div>
        )}
        {result && (
          <div className="text-center">
            <div className={`text-7xl font-black mb-2 ${result.won ? 'text-green-400' : 'text-red-400'}`}>
              {result.roll}
            </div>
            {result.won ? (
              <div>
                <div className="text-green-400 font-black text-xl">WIN! 🎉</div>
                <div className="text-white font-black text-2xl mt-1">+₹{result.payout.toFixed(2)}</div>
                <div className="text-gray-500 text-xs mt-1">at {result.multiplier}×</div>
              </div>
            ) : (
              <div>
                <div className="text-red-400 font-black text-xl">LOST 💥</div>
                <div className="text-gray-400 text-sm mt-1">Rolled {result.roll}, needed {prediction} {threshold}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="card p-5 space-y-5">
        {/* Over / Under toggle */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Prediction</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPrediction('under')}
              className={`py-3 rounded-xl font-black text-sm transition-all ${prediction === 'under' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' : 'bg-casino-800 text-gray-500 border border-gray-700'}`}
            >
              ↓ Roll Under
            </button>
            <button
              onClick={() => setPrediction('over')}
              className={`py-3 rounded-xl font-black text-sm transition-all ${prediction === 'over' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' : 'bg-casino-800 text-gray-500 border border-gray-700'}`}
            >
              ↑ Roll Over
            </button>
          </div>
        </div>

        {/* Threshold slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-400 text-xs uppercase tracking-widest">
              {prediction === 'over' ? `Over ${threshold}` : `Under ${threshold}`}
            </label>
            <span className="text-gray-300 text-sm font-bold">{(winChance * 100).toFixed(0)}% win chance</span>
          </div>
          <input
            type="range" min={2} max={98} value={threshold}
            onChange={e => setThreshold(parseInt(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-gray-700 text-xs mt-1">
            <span>2</span>
            <span>50</span>
            <span>98</span>
          </div>
        </div>

        {/* Quick threshold presets */}
        <div className="flex gap-2 flex-wrap">
          {[[25, 'under'], [49, 'under'], [50, 'over'], [75, 'over'], [90, 'over']].map(([t, p]) => (
            <button
              key={`${t}-${p}`}
              onClick={() => { setThreshold(t as number); setPrediction(p as 'over' | 'under') }}
              className="text-xs bg-casino-800 border border-gray-700 hover:border-purple-500 text-gray-400 px-2.5 py-1 rounded-lg transition-colors"
            >
              {p} {t} ({p === 'over' ? (100 - (t as number)) : t}%)
            </button>
          ))}
        </div>

        {/* Multiplier & payout info */}
        <div className="bg-casino-950 rounded-xl p-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-gray-600 text-xs mb-0.5">Multiplier</div>
            <div className="text-gold-400 font-black">{multiplier}×</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs mb-0.5">Win Chance</div>
            <div className="text-white font-black">{(winChance * 100).toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-600 text-xs mb-0.5">Potential Win</div>
            <div className="text-green-400 font-black">₹{potentialWin.toFixed(0)}</div>
          </div>
        </div>

        {/* Bet amount */}
        <div>
          <label className="text-gray-400 text-xs uppercase tracking-widest mb-2 block">Bet Amount (₹)</label>
          <input
            type="number" className="input-dark font-bold text-lg" placeholder="Enter amount"
            value={betAmount} onChange={e => setBetAmount(e.target.value)} min="1"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {presets.map(p => (
              <button key={p} onClick={() => setBetAmount(String(p))}
                className="text-xs bg-casino-800 border border-gray-700 hover:border-purple-500 text-gray-300 px-2.5 py-1 rounded-lg transition-colors">
                ₹{p}
              </button>
            ))}
            <button onClick={() => setBetAmount(String(Math.floor((balance ?? 0) / 2)))}
              className="text-xs bg-casino-800 border border-gray-700 hover:border-purple-500 text-gray-300 px-2.5 py-1 rounded-lg transition-colors">
              ½
            </button>
            <button onClick={() => setBetAmount(String(Math.floor(balance ?? 0)))}
              className="text-xs bg-casino-800 border border-gray-700 hover:border-yellow-500 text-yellow-600 px-2.5 py-1 rounded-lg transition-colors">
              Max
            </button>
          </div>
        </div>

        {error && <div className="text-red-400 text-sm text-center">{error}</div>}

        <button
          onClick={roll}
          disabled={loading || !betAmount || parseFloat(betAmount) < 1}
          className="btn-gold w-full py-4 rounded-xl font-black text-lg disabled:opacity-40"
        >
          {loading ? 'Rolling...' : `Roll ${prediction === 'over' ? 'Over' : 'Under'} ${threshold} 🎲`}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card p-4 mt-6">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-3">Recent Rolls</div>
          <div className="flex gap-1.5 flex-wrap">
            {history.map((h, i) => (
              <span key={i} className={`text-xs font-bold px-2.5 py-1 rounded-full ${h.won ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                {h.roll} {h.prediction === 'over' ? '↑' : '↓'}{h.threshold}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Game info */}
      <div className="card p-4 mt-4">
        <div className="text-gray-600 text-xs uppercase tracking-widest mb-2">Game Info</div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-gray-500">House edge</span><span className="text-white">5%</span></div>
          <div className="flex justify-between"><span className="text-gray-500">RTP</span><span className="text-green-400 font-bold">95%</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Roll range</span><span className="text-white">0–100</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Min bet</span><span className="text-white">₹1</span></div>
        </div>
      </div>
    </div>
  )
}
