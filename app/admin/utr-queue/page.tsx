'use client'
import { useEffect, useState } from 'react'

interface LotteryTicket {
  id: string; utrNumber: string; createdAt: string
  user: { name: string; email: string }
  lottery: { name: string; ticketPrice: number }
}

interface PredictionBet {
  id: string; utrNumber: string; amount: number; option: string; createdAt: string
  user: { name: string; email: string }
  question: { id: string; question: string; optionA: string; optionB: string }
}

export default function UTRQueue() {
  const [tickets, setTickets] = useState<LotteryTicket[]>([])
  const [bets, setBets] = useState<PredictionBet[]>([])
  const [tab, setTab] = useState<'lottery' | 'predictions'>('lottery')
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const load = async () => {
    const [t, b] = await Promise.all([
      fetch('/api/admin/utr').then(r => r.json()),
      fetch('/api/admin/predictions/utr').then(r => r.json()),
    ])
    if (Array.isArray(t)) setTickets(t)
    if (Array.isArray(b)) setBets(b)
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [])

  const approveLottery = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    setLoading(null); load()
  }
  const rejectLottery = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', reason }) })
    setLoading(null); setRejecting(null); setReason(''); load()
  }
  const approvePrediction = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/predictions/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    setLoading(null); load()
  }
  const rejectPrediction = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/predictions/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', reason }) })
    setLoading(null); setRejecting(null); setReason(''); load()
  }

  const totalPending = tickets.length + bets.length

  const tabs = [
    { key: 'lottery' as const, label: '🎰 Lottery', count: tickets.length },
    { key: 'predictions' as const, label: '🔮 Predictions', count: bets.length },
  ]

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white">UTR Verification Queue</h1>
        {totalPending > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
            {totalPending} pending
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              tab === t.key ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}>
            {t.label}
            {t.count > 0 && <span className="bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full border border-yellow-500/30">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'lottery' && (
        tickets.length === 0 ? (
          <div className="card p-12 text-center"><div className="text-4xl mb-4">✅</div><div className="text-gray-400 font-bold">Lottery queue is clear</div></div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{t.user.name}</span>
                      <span className="text-gray-600 text-xs">{t.user.email}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-1">
                      Lottery: <span className="text-purple-300">{t.lottery.name}</span> · Amount: <span className="text-gold-400 font-bold">₹{t.lottery.ticketPrice}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-casino-950 rounded-xl px-3 py-2 w-fit">
                      <span className="text-gray-500 text-xs">UTR:</span>
                      <span className="font-mono text-yellow-300 font-bold tracking-wider">{t.utrNumber}</span>
                    </div>
                    <div className="text-gray-700 text-xs mt-1">{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => approveLottery(t.id)} disabled={loading === t.id} className="btn-gold px-4 py-2 text-sm rounded-lg font-black disabled:opacity-40">
                      {loading === t.id ? '...' : '✓ Approve'}
                    </button>
                    <button onClick={() => setRejecting(rejecting === t.id ? null : t.id)} className="btn-danger px-4 py-2 text-sm rounded-lg">✗ Reject</button>
                  </div>
                </div>
                {rejecting === t.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                    <input className="input-dark flex-1 text-sm py-2" placeholder="Rejection reason" value={reason} onChange={e => setReason(e.target.value)} />
                    <button onClick={() => rejectLottery(t.id)} disabled={loading === t.id} className="btn-danger px-4 py-2 text-sm rounded-lg">Confirm</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'predictions' && (
        bets.length === 0 ? (
          <div className="card p-12 text-center"><div className="text-4xl mb-4">✅</div><div className="text-gray-400 font-bold">Predictions queue is clear</div></div>
        ) : (
          <div className="space-y-3">
            {bets.map(b => (
              <div key={b.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-bold">{b.user.name}</span>
                      <span className="text-gray-600 text-xs">{b.user.email}</span>
                    </div>
                    <div className="text-gray-400 text-sm mb-1 line-clamp-1">{b.question.question}</div>
                    <div className="text-gray-500 text-sm mb-1">
                      Pick: <span className={`font-bold ${b.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                        {b.option === 'A' ? b.question.optionA : b.question.optionB}
                      </span> · Amount: <span className="text-gold-400 font-bold">₹{b.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-casino-950 rounded-xl px-3 py-2 w-fit">
                      <span className="text-gray-500 text-xs">UTR:</span>
                      <span className="font-mono text-yellow-300 font-bold tracking-wider">{b.utrNumber}</span>
                    </div>
                    <div className="text-gray-700 text-xs mt-1">{new Date(b.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => approvePrediction(b.id)} disabled={loading === b.id} className="btn-gold px-4 py-2 text-sm rounded-lg font-black disabled:opacity-40">
                      {loading === b.id ? '...' : '✓ Approve'}
                    </button>
                    <button onClick={() => setRejecting(rejecting === b.id ? null : b.id)} className="btn-danger px-4 py-2 text-sm rounded-lg">✗ Reject</button>
                  </div>
                </div>
                {rejecting === b.id && (
                  <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                    <input className="input-dark flex-1 text-sm py-2" placeholder="Rejection reason" value={reason} onChange={e => setReason(e.target.value)} />
                    <button onClick={() => rejectPrediction(b.id)} disabled={loading === b.id} className="btn-danger px-4 py-2 text-sm rounded-lg">Confirm</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
