'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

const GROWTH = 0.00006  // must match server

interface Bet { id: string; userId: string; userName: string; betAmount: number; cashedOutAt: number | null; status: string }
interface Round {
  id: string; status: string; createdAt: string; startedAt: string | null
  crashedAt: string | null; crashPoint: number | null; bets: Bet[]
}

export default function CrashClient({ userId }: { userId: string | null }) {
  const [round, setRound] = useState<Round | null>(null)
  const [mult, setMult] = useState(1.0)
  const [betAmount, setBetAmount] = useState('100')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [autoCashout, setAutoCashout] = useState('')
  const [history, setHistory] = useState<{ id: string; crashPoint: number }[]>([])
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const myBet = round?.bets.find(b => b.userId === userId)

  const fetchBalance = useCallback(async () => {
    const res = await fetch('/api/wallet')
    if (res.ok) { const d = await res.json(); setBalance(d.balance) }
  }, [])

  const fetchRound = useCallback(async () => {
    const res = await fetch('/api/crash/state')
    if (!res.ok) return
    const data: Round = await res.json()
    setRound(prev => {
      if (prev?.status === 'IN_PROGRESS' && data.status === 'CRASHED') {
        setHistory(h => [{ id: data.id, crashPoint: data.crashPoint! }, ...h].slice(0, 15))
        fetchBalance()
      }
      return data
    })
  }, [fetchBalance])

  // Multiplier animation
  useEffect(() => {
    if (round?.status === 'IN_PROGRESS' && round.startedAt) {
      const tick = () => {
        const elapsed = Date.now() - new Date(round.startedAt!).getTime()
        setMult(Math.exp(GROWTH * elapsed))
        animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      if (round?.status !== 'IN_PROGRESS') setMult(1.0)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [round?.status, round?.startedAt])

  // Auto-cashout
  useEffect(() => {
    if (!autoCashout || !myBet || myBet.status !== 'ACTIVE') return
    const target = parseFloat(autoCashout)
    if (mult >= target) cashout()
  }, [mult, autoCashout, myBet])

  // Poll round state
  useEffect(() => {
    fetchRound()
    fetchBalance()
    const interval = setInterval(fetchRound, 500)
    return () => clearInterval(interval)
  }, [fetchRound, fetchBalance])

  const placeBet = async () => {
    if (!userId) { window.location.href = '/login'; return }
    setLoading(true); setError('')
    const res = await fetch('/api/crash/bet', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: betAmount }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    fetchRound(); fetchBalance()
  }

  const cashout = async () => {
    setLoading(true)
    const res = await fetch('/api/crash/cashout', { method: 'POST' })
    const d = await res.json()
    setLoading(false)
    if (d.ok) { fetchRound(); fetchBalance() }
    else setError(d.error ?? 'Cashout failed')
  }

  const waiting = round?.status === 'WAITING'
  const inProgress = round?.status === 'IN_PROGRESS'
  const crashed = round?.status === 'CRASHED'

  const multColor = mult < 2 ? 'text-green-400' : mult < 5 ? 'text-yellow-400' : mult < 10 ? 'text-orange-400' : 'text-red-400'

  const presets = [50, 100, 200, 500, 1000]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* History bar */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {history.map(h => (
          <span key={h.id} className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
            h.crashPoint <= 1.5 ? 'bg-red-900/40 text-red-400' :
            h.crashPoint <= 3 ? 'bg-yellow-900/40 text-yellow-400' :
            h.crashPoint <= 10 ? 'bg-green-900/40 text-green-400' :
            'bg-blue-900/40 text-blue-400'
          }`}>
            {h.crashPoint.toFixed(2)}×
          </span>
        ))}
        {history.length === 0 && <span className="text-gray-700 text-xs">Crash history will appear here</span>}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Main display */}
        <div className="md:col-span-2">
          <div className="card overflow-hidden" style={{ minHeight: 320 }}>
            {/* Multiplier display */}
            <div className="flex flex-col items-center justify-center h-72 relative">
              {/* Background grid lines */}
              <div className="absolute inset-0 opacity-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute w-full border-b border-white" style={{ bottom: `${i * 20}%` }} />
                ))}
              </div>

              {waiting && (
                <div className="text-center">
                  <div className="text-gray-500 text-sm mb-3 uppercase tracking-widest">Next round starting in...</div>
                  <div className="text-white font-black text-6xl">🚀</div>
                  <div className="text-gray-400 text-sm mt-3 animate-pulse">Place your bet!</div>
                </div>
              )}

              {inProgress && (
                <div className="text-center">
                  <div className={`font-black text-7xl md:text-8xl transition-colors ${multColor} animate-glow`}>
                    {mult.toFixed(2)}×
                  </div>
                  <div className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Flying...</div>
                </div>
              )}

              {crashed && (
                <div className="text-center">
                  <div className="text-red-400 font-black text-2xl mb-2 animate-pulse">💥 CRASHED</div>
                  <div className="text-red-400 font-black text-6xl">{round?.crashPoint?.toFixed(2)}×</div>
                  <div className="text-gray-500 text-sm mt-2">Next round starting soon...</div>
                </div>
              )}
            </div>

            {/* Balance bar */}
            <div className="px-4 py-3 border-t border-gray-900 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-500">Balance: </span>
                <span className="text-gold-400 font-black">₹{(balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <a href="/wallet" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">+ Deposit</a>
            </div>
          </div>

          {/* Active bets list */}
          {round && round.bets.length > 0 && (
            <div className="mt-4 card p-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-3">Active Bets</div>
              <div className="space-y-2">
                {round.bets.map(b => (
                  <div key={b.id} className={`flex items-center justify-between text-sm p-2 rounded-lg ${b.userId === userId ? 'bg-purple-900/20 border border-purple-700/30' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${b.status === 'CASHED_OUT' ? 'bg-green-500' : b.status === 'LOST' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                      <span className={b.userId === userId ? 'text-purple-300 font-bold' : 'text-gray-400'}>{b.userName}</span>
                    </div>
                    <div className="text-right">
                      {b.status === 'CASHED_OUT' ? (
                        <span className="text-green-400 font-bold">+₹{((b.cashedOutAt ?? 0) * b.betAmount).toFixed(0)} @ {b.cashedOutAt}×</span>
                      ) : b.status === 'LOST' ? (
                        <span className="text-red-400 text-xs">-₹{b.betAmount}</span>
                      ) : (
                        <span className="text-yellow-400">₹{b.betAmount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Bet / Cashout card */}
          <div className="card p-5">
            {myBet?.status === 'ACTIVE' && inProgress ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-gray-400 text-xs mb-1">Your bet</div>
                  <div className="text-white font-black text-xl">₹{myBet.betAmount}</div>
                  <div className="text-green-400 font-black text-sm">
                    → ₹{(myBet.betAmount * mult).toFixed(2)} now
                  </div>
                </div>
                <button onClick={cashout} disabled={loading} className="btn-gold w-full py-4 rounded-xl font-black text-lg">
                  {loading ? '...' : `Cash Out @ ${mult.toFixed(2)}×`}
                </button>
                <div>
                  <label className="text-gray-500 text-xs mb-1 block">Auto cash-out at ×</label>
                  <input type="number" className="input-dark text-sm py-2" placeholder="e.g. 2.00" min="1.01" step="0.01"
                    value={autoCashout} onChange={e => setAutoCashout(e.target.value)} />
                </div>
              </div>
            ) : myBet?.status === 'CASHED_OUT' ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-green-400 font-black">Cashed out at {myBet.cashedOutAt}×</div>
                <div className="text-white font-black text-2xl mt-1">
                  +₹{((myBet.cashedOutAt ?? 0) * myBet.betAmount).toFixed(2)}
                </div>
              </div>
            ) : myBet?.status === 'LOST' ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">💥</div>
                <div className="text-red-400 font-black">Crashed!</div>
                <div className="text-gray-400 text-sm mt-1">Lost ₹{myBet.betAmount}</div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-gold-400 font-black">Place Bet</h3>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Amount (₹)</label>
                  <input type="number" className="input-dark font-bold" placeholder="Bet amount" min="1"
                    value={betAmount} onChange={e => setBetAmount(e.target.value)} />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {presets.map(p => (
                      <button key={p} onClick={() => setBetAmount(String(p))}
                        className="text-xs bg-casino-800 border border-gray-700 hover:border-purple-500 text-gray-300 px-2.5 py-1 rounded-lg transition-colors">
                        ₹{p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 text-xs mb-1 block">Auto cash-out at ×</label>
                  <input type="number" className="input-dark text-sm py-2" placeholder="Optional (e.g. 2.00)"
                    min="1.01" step="0.01" value={autoCashout} onChange={e => setAutoCashout(e.target.value)} />
                </div>
                <button
                  onClick={placeBet}
                  disabled={loading || !waiting}
                  className={`w-full py-3.5 rounded-xl font-black text-base transition-all ${
                    waiting ? 'btn-gold' : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {loading ? '...' : waiting ? 'Place Bet 🚀' : inProgress ? 'Wait for next round' : 'Loading...'}
                </button>
              </div>
            )}
            {error && <div className="text-red-400 text-xs mt-2 text-center">{error}</div>}
          </div>

          {/* House edge info */}
          <div className="card p-4">
            <div className="text-gray-600 text-xs uppercase tracking-widest mb-2">Game Info</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">House edge</span><span className="text-white">5%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">RTP</span><span className="text-green-400 font-bold">95%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Instant cashout</span><span className="text-white">Any multiplier</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Min bet</span><span className="text-white">₹1</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
