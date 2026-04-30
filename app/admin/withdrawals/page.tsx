'use client'
import { useEffect, useState } from 'react'

interface Withdrawal {
  id: string
  amount: number
  upiId: string
  status: string
  paymentRef: string | null
  createdAt: string
  user: { name: string; email: string }
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({})
  const [tab, setTab] = useState<'PENDING' | 'PAID' | 'REJECTED'>('PENDING')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/withdrawals')
    if (res.ok) setWithdrawals(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const pay = async (id: string) => {
    setActionId(id)
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'pay', paymentRef: paymentRefs[id] ?? '' }),
    })
    setActionId(null); load()
  }

  const reject = async (id: string) => {
    setActionId(id)
    await fetch('/api/admin/withdrawals', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reject' }),
    })
    setActionId(null); load()
  }

  const filtered = withdrawals.filter(w => w.status === tab)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-white mb-6">Withdrawal Requests</h1>

      <div className="flex gap-2 mb-6">
        {(['PENDING', 'PAID', 'REJECTED'] as const).map(t => {
          const count = withdrawals.filter(w => w.status === t).length
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
        <div className="card p-10 text-center text-gray-600">No {tab.toLowerCase()} withdrawals</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(w => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-black text-lg">₹{w.amount.toLocaleString('en-IN')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'PAID' ? 'badge-approved' : w.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{w.status}</span>
                  </div>
                  <div className="text-gray-400 text-sm">{w.user.name} <span className="text-gray-600">({w.user.email})</span></div>
                  <div className="text-gray-300 text-sm font-mono mt-1">→ {w.upiId}</div>
                  {w.paymentRef && <div className="text-green-500 text-xs mt-0.5">Ref: {w.paymentRef}</div>}
                  <div className="text-gray-700 text-xs mt-0.5">{new Date(w.createdAt).toLocaleString('en-IN')}</div>
                </div>

                {w.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex gap-1">
                      <input
                        type="text" placeholder="UTR / ref (optional)"
                        className="input-dark text-xs py-1.5 w-36"
                        value={paymentRefs[w.id] ?? ''}
                        onChange={e => setPaymentRefs(r => ({ ...r, [w.id]: e.target.value }))}
                      />
                      <button onClick={() => pay(w.id)} disabled={actionId === w.id}
                        className="bg-green-600/20 border border-green-600/40 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-40">
                        ✓ Paid
                      </button>
                    </div>
                    <button onClick={() => reject(w.id)} disabled={actionId === w.id}
                      className="bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-40">
                      ✕ Reject (refund)
                    </button>
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
