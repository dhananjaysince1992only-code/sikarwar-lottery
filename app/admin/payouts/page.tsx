'use client'
import { useEffect, useState } from 'react'

interface PayoutTicket {
  id: string
  prizeAmount: number
  claimUpiId: string
  tierName: string
  createdAt: string
  user: { name: string; email: string }
  lottery: { name: string }
}

export default function PayoutsPage() {
  const [tickets, setTickets] = useState<PayoutTicket[]>([])
  const [paying, setPaying] = useState<string | null>(null)
  const [ref, setRef] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/payouts')
    setTickets(await res.json())
  }

  useEffect(() => { load() }, [])

  const markPaid = async (id: string) => {
    setPaying(id)
    await fetch(`/api/admin/payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentRef: ref }),
    })
    setPaying(null)
    setRef('')
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Winner Payouts</h1>

      {tickets.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">💰</div>
          <div className="text-gray-400 font-bold">No pending payouts</div>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="card p-5 border-yellow-500/20">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold">{t.user.name}</span>
                    <span className="text-gray-600 text-xs">{t.user.email}</span>
                  </div>
                  <div className="text-gray-500 text-sm">{t.lottery.name} · {t.tierName}</div>
                  <div className="text-gold-400 font-black text-xl mt-1">₹{t.prizeAmount?.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-2 mt-2 bg-casino-950 rounded-xl px-3 py-2 w-fit">
                    <span className="text-gray-500 text-xs">Pay to UPI:</span>
                    <span className="font-mono text-white font-bold">{t.claimUpiId}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <input
                    className="input-dark text-sm py-2 w-40"
                    placeholder="Payment ref (UTR)"
                    value={paying === t.id ? ref : ''}
                    onFocus={() => setPaying(t.id)}
                    onChange={e => setRef(e.target.value)}
                  />
                  <button
                    onClick={() => markPaid(t.id)}
                    disabled={paying === t.id && !ref}
                    className="btn-gold px-4 py-2 text-sm rounded-lg font-black disabled:opacity-40"
                  >
                    ✓ Mark Paid
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
