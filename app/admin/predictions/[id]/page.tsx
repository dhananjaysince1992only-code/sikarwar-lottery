'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Bet {
  id: string; option: string; amount: number; utrNumber: string; utrStatus: string
  payout: number | null; payoutStatus: string; claimUpiId: string
  user: { name: string; email: string }
}
interface Question {
  id: string; question: string; optionA: string; optionB: string
  status: string; winningOption: string; commission: number
  bets: Bet[]
}

export default function AdminPredictionDetail() {
  const { id } = useParams()
  const [q, setQ] = useState<Question | null>(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [payRef, setPayRef] = useState('')

  const load = async () => {
    const res = await fetch(`/api/admin/predictions`)
    const all = await res.json()
    const found = all.find((x: Question) => x.id === id)
    if (found) setQ(found)
  }

  useEffect(() => { load() }, [id])

  const resolve = async (opt: 'A' | 'B') => {
    if (!confirm(`Resolve with "${opt === 'A' ? q?.optionA : q?.optionB}" as winner?`)) return
    setLoading('resolve')
    const res = await fetch(`/api/admin/predictions/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winningOption: opt }),
    })
    const data = await res.json()
    setLoading(null)
    setMsg(data.ok
      ? `Resolved! ${data.winners} winners share ₹${data.prizePool?.toFixed(0)} prize pool.`
      : data.error)
    load()
  }

  const verifyBet = async (betId: string, action: 'approve' | 'reject') => {
    setLoading(betId)
    await fetch(`/api/admin/predictions/utr/${betId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLoading(null)
    load()
  }

  const markPaid = async (betId: string) => {
    await fetch('/api/admin/predictions/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betId, paymentRef: payRef }),
    })
    setPayRef('')
    load()
  }

  if (!q) return <div className="text-gray-500 py-12 text-center">Loading...</div>

  const approved = q.bets.filter(b => b.utrStatus === 'APPROVED')
  const pending = q.bets.filter(b => b.utrStatus === 'PENDING')
  const poolA = approved.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
  const poolB = approved.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
  const total = poolA + poolB
  const prizePool = total * (1 - q.commission / 100)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/predictions" className="text-gray-600 hover:text-gray-400 text-sm">← Predictions</Link>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${q.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>{q.status}</span>
      </div>

      <h1 className="text-xl font-black text-white mb-6 leading-tight">{q.question}</h1>

      {msg && <div className="mb-4 bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 text-green-400 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Stats */}
        <div className="card p-5">
          <h3 className="text-gold-400 font-bold mb-3">Pool Stats</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Option A', `${q.optionA} — ₹${poolA.toLocaleString('en-IN')}`],
              ['Option B', `${q.optionB} — ₹${poolB.toLocaleString('en-IN')}`],
              ['Total Pool', `₹${total.toLocaleString('en-IN')}`],
              ['House ('+q.commission+'%)', `₹${(total * q.commission / 100).toFixed(0)}`],
              ['Prize Pool', `₹${prizePool.toFixed(0)}`],
              ['Pending UTRs', pending.length],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-900 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>

          {q.status === 'OPEN' && (
            <div className="mt-4 space-y-2">
              <div className="text-gray-500 text-xs mb-2">Resolve with winner:</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => resolve('A')} disabled={loading === 'resolve'} className="py-2.5 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-green-400 font-bold text-sm border border-green-600/30 transition-all">
                  {q.optionA} Wins
                </button>
                <button onClick={() => resolve('B')} disabled={loading === 'resolve'} className="py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 font-bold text-sm border border-red-600/30 transition-all">
                  {q.optionB} Wins
                </button>
              </div>
            </div>
          )}

          {q.status === 'RESOLVED' && (
            <div className="mt-4 text-center">
              <div className="text-gray-500 text-sm">Winner:</div>
              <div className={`font-black text-xl ${q.winningOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                {q.winningOption === 'A' ? q.optionA : q.optionB}
              </div>
            </div>
          )}
        </div>

        {/* Pending UTRs */}
        <div className="card p-5">
          <h3 className="text-gold-400 font-bold mb-3">Pending UTRs ({pending.length})</h3>
          {pending.length === 0
            ? <div className="text-gray-700 text-sm">No pending verifications</div>
            : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {pending.map(b => (
                  <div key={b.id} className="bg-casino-950 rounded-xl p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm font-bold">{b.user.name}</span>
                      <span className={`text-xs font-bold ${b.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                        {b.option === 'A' ? q.optionA : q.optionB}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mb-2">₹{b.amount} · UTR: {b.utrNumber}</div>
                    <div className="flex gap-2">
                      <button onClick={() => verifyBet(b.id, 'approve')} disabled={loading === b.id} className="flex-1 py-1.5 text-xs font-black btn-gold rounded-lg">
                        {loading === b.id ? '...' : '✓ Approve'}
                      </button>
                      <button onClick={() => verifyBet(b.id, 'reject')} disabled={loading === b.id} className="flex-1 py-1.5 text-xs font-bold btn-danger rounded-lg">
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* All bets */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-900">
          <h3 className="text-gold-400 font-bold">All Bets ({q.bets.length})</h3>
        </div>
        <table className="admin-table">
          <thead><tr><th>User</th><th>Pick</th><th>Amount</th><th>UTR Status</th><th>Payout</th><th>Pay Action</th></tr></thead>
          <tbody>
            {q.bets.map(b => (
              <tr key={b.id}>
                <td>
                  <div className="text-white text-sm font-medium">{b.user.name}</div>
                  <div className="text-gray-600 text-xs">{b.user.email}</div>
                </td>
                <td><span className={`font-bold text-sm ${b.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>{b.option === 'A' ? q.optionA : q.optionB}</span></td>
                <td className="font-bold">₹{b.amount.toLocaleString('en-IN')}</td>
                <td><span className={`text-xs px-2 py-0.5 rounded-full ${b.utrStatus === 'APPROVED' ? 'badge-approved' : b.utrStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{b.utrStatus}</span></td>
                <td className="text-gold-400 font-bold">{b.payout ? `₹${b.payout.toLocaleString('en-IN')}` : '—'}</td>
                <td>
                  {b.payoutStatus === 'CLAIMED' && (
                    <div className="flex gap-1">
                      <input className="input-dark text-xs py-1 w-24" placeholder="UTR ref" value={payRef} onChange={e => setPayRef(e.target.value)} />
                      <button onClick={() => markPaid(b.id)} className="btn-gold px-2 py-1 text-xs rounded">Pay</button>
                    </div>
                  )}
                  {b.payoutStatus === 'PAID' && <span className="text-green-400 text-xs">✓ Paid</span>}
                  {b.payoutStatus === 'UNPAID' && b.payout && <span className="text-yellow-600 text-xs">Awaiting claim</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
