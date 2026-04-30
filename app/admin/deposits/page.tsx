'use client'
import { useEffect, useState } from 'react'

interface Deposit {
  id: string
  amount: number
  utrNumber: string
  status: string
  createdAt: string
  user: { name: string; email: string }
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/deposits')
    if (res.ok) setDeposits(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string) => {
    setActionId(id)
    await fetch('/api/admin/deposits', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) })
    setActionId(null); load()
  }

  const reject = async (id: string) => {
    setActionId(id)
    await fetch('/api/admin/deposits', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'reject', reason: rejectReasons[id] ?? '' }) })
    setActionId(null); load()
  }

  const filtered = deposits.filter(d => d.status === tab)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">Deposit Requests</h1>

      <div className="flex gap-2 mb-6">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(t => {
          const count = deposits.filter(d => d.status === t).length
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-gray-500 hover:text-gray-300'}`}>
              {t} {count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${t === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : ''}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-10">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-600">No {tab.toLowerCase()} deposits</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-black text-lg">₹{d.amount.toLocaleString('en-IN')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'APPROVED' ? 'badge-approved' : d.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{d.status}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{d.user.name} <span className="text-gray-600">({d.user.email})</span></div>
                  <div className="text-gray-500 text-xs font-mono mt-1">UTR: {d.utrNumber}</div>
                  <div className="text-gray-700 text-xs mt-0.5">{new Date(d.createdAt).toLocaleString('en-IN')}</div>
                </div>

                {d.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => approve(d.id)} disabled={actionId === d.id}
                      className="bg-green-600/20 border border-green-600/40 text-green-400 hover:bg-green-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40">
                      ✓ Approve
                    </button>
                    <div className="flex gap-1">
                      <input
                        type="text" placeholder="Reason (optional)"
                        className="input-dark text-xs py-1.5 w-36"
                        value={rejectReasons[d.id] ?? ''}
                        onChange={e => setRejectReasons(r => ({ ...r, [d.id]: e.target.value }))}
                      />
                      <button onClick={() => reject(d.id)} disabled={actionId === d.id}
                        className="bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-40">
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
