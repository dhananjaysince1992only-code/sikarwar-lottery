'use client'
import { useEffect, useState } from 'react'

interface Ticket {
  id: string
  utrNumber: string
  createdAt: string
  user: { name: string; email: string }
  lottery: { name: string; ticketPrice: number }
}

export default function UTRQueue() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/utr')
    const data = await res.json()
    setTickets(data)
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [])

  const approve = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    setLoading(null)
    load()
  }

  const reject = async (id: string) => {
    setLoading(id)
    await fetch(`/api/admin/utr/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', reason }) })
    setLoading(null)
    setRejecting(null)
    setReason('')
    load()
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-black text-white">UTR Verification Queue</h1>
        {tickets.length > 0 && (
          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
            {tickets.length} pending
          </span>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">✅</div>
          <div className="text-gray-400 font-bold">Queue is clear</div>
          <div className="text-gray-600 text-sm mt-1">All UTRs have been verified</div>
        </div>
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
                    Lottery: <span className="text-purple-300">{t.lottery.name}</span> ·
                    Amount: <span className="text-gold-400 font-bold">₹{t.lottery.ticketPrice}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-casino-950 rounded-xl px-3 py-2 w-fit">
                    <span className="text-gray-500 text-xs">UTR:</span>
                    <span className="font-mono text-white font-bold tracking-wider">{t.utrNumber}</span>
                  </div>
                  <div className="text-gray-700 text-xs mt-1">{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => approve(t.id)}
                    disabled={loading === t.id}
                    className="btn-gold px-4 py-2 text-sm rounded-lg font-black disabled:opacity-40"
                  >
                    {loading === t.id ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => setRejecting(rejecting === t.id ? null : t.id)}
                    className="btn-danger px-4 py-2 text-sm rounded-lg"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>

              {rejecting === t.id && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
                  <input
                    className="input-dark flex-1 text-sm py-2"
                    placeholder="Rejection reason (e.g. Payment not received)"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                  <button onClick={() => reject(t.id)} disabled={loading === t.id} className="btn-danger px-4 py-2 text-sm rounded-lg">
                    Confirm
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
