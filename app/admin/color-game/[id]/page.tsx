'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Bet {
  id: string; color: string; amount: number; utrNumber: string; utrStatus: string
  utrRejectionReason: string; payout: number | null; payoutStatus: string; claimUpiId: string
  user: { name: string; email: string }; createdAt: string
}
interface Round {
  id: string; title: string; status: string; result: string; upiId: string; bets: Bet[]
}

const COLOR_CONFIG: Record<string, { label: string; text: string; dot: string; bg: string; border: string; multi: number }> = {
  red: { label: 'Red', text: 'text-red-400', dot: 'bg-red-500', bg: 'bg-red-900/20', border: 'border-red-500/40', multi: 1.9 },
  green: { label: 'Green', text: 'text-green-400', dot: 'bg-green-500', bg: 'bg-green-900/20', border: 'border-green-500/40', multi: 1.9 },
  violet: { label: 'Violet', text: 'text-violet-400', dot: 'bg-violet-500', bg: 'bg-violet-900/20', border: 'border-violet-500/40', multi: 4.5 },
}

export default function AdminColorRound() {
  const { id } = useParams()
  const [round, setRound] = useState<Round | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const [payRef, setPayRef] = useState<Record<string, string>>({})

  const load = async () => {
    const res = await fetch(`/api/admin/color-game/${id}`)
    if (res.ok) setRound(await res.json())
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [id])

  const resolve = async (color: string) => {
    if (!confirm(`Draw result: ${COLOR_CONFIG[color]?.label}?`)) return
    setLoading('resolve')
    const res = await fetch(`/api/admin/color-game/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', result: color }),
    })
    const data = await res.json()
    setLoading(null)
    setMsg(data.ok ? `✓ Result: ${COLOR_CONFIG[color]?.label}! ${data.winners} winners at ${data.multiplier}×` : (data.error ?? 'Error'))
    load()
  }

  const verifyBet = async (betId: string, action: 'approve' | 'reject') => {
    setLoading(betId)
    await fetch(`/api/admin/color-game/${id}/utr/${betId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: rejectReason[betId] ?? '' }),
    })
    setLoading(null)
    setRejectingId(null)
    load()
  }

  const markPaid = async (betId: string) => {
    await fetch('/api/admin/color-game/payouts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ betId, paymentRef: payRef[betId] ?? '' }),
    })
    setPayRef(p => ({ ...p, [betId]: '' }))
    load()
  }

  if (!round) return <div className="text-gray-500 py-12 text-center">Loading...</div>

  const approved = round.bets.filter(b => b.utrStatus === 'APPROVED')
  const pending = round.bets.filter(b => b.utrStatus === 'PENDING')
  const poolRed = approved.filter(b => b.color === 'red').reduce((s, b) => s + b.amount, 0)
  const poolGreen = approved.filter(b => b.color === 'green').reduce((s, b) => s + b.amount, 0)
  const poolViolet = approved.filter(b => b.color === 'violet').reduce((s, b) => s + b.amount, 0)
  const total = poolRed + poolGreen + poolViolet

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/color-game" className="text-gray-600 hover:text-gray-400 text-sm">← Color Game</Link>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${round.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>{round.status}</span>
        {round.result && (
          <span className={`w-4 h-4 rounded-full ${COLOR_CONFIG[round.result]?.dot ?? 'bg-gray-500'}`} />
        )}
      </div>

      <h1 className="text-2xl font-black text-white mb-6">{round.title}</h1>

      {msg && <div className="mb-4 bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 text-green-400 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Pool stats + resolve */}
        <div className="card p-5">
          <h3 className="text-gold-400 font-bold mb-3">Pool Stats</h3>
          <div className="space-y-2 text-sm mb-4">
            {[
              ['Red Pool', `₹${poolRed.toLocaleString('en-IN')} (${approved.filter(b => b.color === 'red').length} bets)`],
              ['Green Pool', `₹${poolGreen.toLocaleString('en-IN')} (${approved.filter(b => b.color === 'green').length} bets)`],
              ['Violet Pool', `₹${poolViolet.toLocaleString('en-IN')} (${approved.filter(b => b.color === 'violet').length} bets)`],
              ['Total Pool', `₹${total.toLocaleString('en-IN')}`],
              ['Pending UTRs', String(pending.length)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-gray-900 pb-2 last:border-0">
                <span className="text-gray-500">{k}</span>
                <span className={`font-bold ${k === 'Pending UTRs' && pending.length > 0 ? 'text-yellow-400' : 'text-white'}`}>{v}</span>
              </div>
            ))}
          </div>

          {round.status === 'OPEN' && (
            <div>
              <div className="text-gray-500 text-xs mb-3 uppercase tracking-widest">Draw Result:</div>
              <div className="grid grid-cols-3 gap-2">
                {['red', 'green', 'violet'].map(color => {
                  const cfg = COLOR_CONFIG[color]
                  return (
                    <button
                      key={color}
                      onClick={() => resolve(color)}
                      disabled={loading === 'resolve'}
                      className={`py-3 rounded-xl ${cfg.bg} border ${cfg.border} ${cfg.text} font-black text-sm transition-all hover:scale-105 disabled:opacity-40`}
                    >
                      <div className={`w-5 h-5 ${cfg.dot} rounded-full mx-auto mb-1`} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {round.status === 'RESOLVED' && round.result && (
            <div className={`text-center p-4 rounded-xl ${COLOR_CONFIG[round.result].bg} border ${COLOR_CONFIG[round.result].border}`}>
              <div className="text-gray-400 text-sm">Result</div>
              <div className={`font-black text-xl ${COLOR_CONFIG[round.result].text}`}>{COLOR_CONFIG[round.result].label}</div>
              <div className="text-gray-400 text-xs">{COLOR_CONFIG[round.result].multi}× payout</div>
            </div>
          )}
        </div>

        {/* Pending UTRs */}
        <div className="card p-5">
          <h3 className="text-gold-400 font-bold mb-3 flex items-center gap-2">
            Pending UTRs
            {pending.length > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/30 animate-pulse">
                {pending.length}
              </span>
            )}
          </h3>
          {pending.length === 0
            ? <div className="text-gray-700 text-sm">No pending verifications</div>
            : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {pending.map(b => {
                  const cfg = COLOR_CONFIG[b.color]
                  return (
                    <div key={b.id} className="bg-casino-950 rounded-xl p-3 border border-yellow-500/10">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-white text-sm font-bold">{b.user.name}</span>
                          <div className="text-gray-600 text-xs">{b.user.email}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 ${cfg?.dot} rounded-full`} />
                          <span className={`text-xs font-bold ${cfg?.text}`}>{cfg?.label}</span>
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm mb-1">₹{b.amount.toLocaleString('en-IN')}</div>
                      <div className="font-mono text-yellow-300 text-xs bg-black/30 rounded px-2 py-1 mb-2">UTR: {b.utrNumber}</div>
                      <div className="flex gap-2">
                        <button onClick={() => verifyBet(b.id, 'approve')} disabled={loading === b.id} className="flex-1 py-1.5 text-xs font-black btn-gold rounded-lg">
                          {loading === b.id ? '...' : '✓ Approve'}
                        </button>
                        <button onClick={() => setRejectingId(rejectingId === b.id ? null : b.id)} className="flex-1 py-1.5 text-xs font-bold btn-danger rounded-lg">
                          ✗ Reject
                        </button>
                      </div>
                      {rejectingId === b.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            className="input-dark text-xs py-1 flex-1"
                            placeholder="Rejection reason"
                            value={rejectReason[b.id] ?? ''}
                            onChange={e => setRejectReason(p => ({ ...p, [b.id]: e.target.value }))}
                          />
                          <button onClick={() => verifyBet(b.id, 'reject')} disabled={loading === b.id} className="btn-danger px-3 py-1 text-xs rounded-lg">
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>

      {/* All bets */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-900">
          <h3 className="text-gold-400 font-bold">All Bets ({round.bets.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead><tr><th>User</th><th>Color</th><th>Amount</th><th>UTR</th><th>Status</th><th>Payout</th><th>Action</th></tr></thead>
            <tbody>
              {round.bets.map(b => {
                const cfg = COLOR_CONFIG[b.color]
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="text-white text-sm font-medium">{b.user.name}</div>
                      <div className="text-gray-600 text-xs">{b.user.email}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 ${cfg?.dot} rounded-full`} />
                        <span className={`font-bold text-sm ${cfg?.text}`}>{cfg?.label}</span>
                      </div>
                    </td>
                    <td className="font-bold">₹{b.amount.toLocaleString('en-IN')}</td>
                    <td><span className="font-mono text-xs text-yellow-300">{b.utrNumber}</span></td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full ${b.utrStatus === 'APPROVED' ? 'badge-approved' : b.utrStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{b.utrStatus}</span></td>
                    <td className="text-gold-400 font-bold">{b.payout ? `₹${b.payout.toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      {b.payoutStatus === 'CLAIMED' && (
                        <div className="flex gap-1">
                          <input className="input-dark text-xs py-1 w-20" placeholder="Ref" value={payRef[b.id] ?? ''} onChange={e => setPayRef(p => ({ ...p, [b.id]: e.target.value }))} />
                          <button onClick={() => markPaid(b.id)} className="btn-gold px-2 py-1 text-xs rounded">Pay</button>
                        </div>
                      )}
                      {b.payoutStatus === 'PAID' && <span className="text-green-400 text-xs">✓ Paid</span>}
                      {b.payoutStatus === 'UNPAID' && b.payout && <span className="text-yellow-600 text-xs">Awaiting claim</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
