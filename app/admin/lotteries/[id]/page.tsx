'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Lottery {
  id: string; name: string; description: string; ticketPrice: number; maxParticipants: number
  winPercent: number; poolPercent: number; status: string; scratchDelay: number
  upiId: string; qrImage: string
  prizeTiers: { id: string; tierName: string; winnerCount: number; amount: number; rank: number }[]
  winningNumbers: { id: string; number: string; prizeAmount: number; tierName: string; winnerName: string }[]
  tickets: { id: string; utrNumber: string; utrStatus: string; user: { name: string; email: string }; isWinner: boolean | null; prizeAmount: number | null; scratchedAt: string | null; payoutStatus: string }[]
}

export default function AdminLotteryDetail() {
  const { id } = useParams()
  const [lottery, setLottery] = useState<Lottery | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const res = await fetch(`/api/admin/lotteries/${id}`)
    const data = await res.json()
    setLottery(data)
  }

  useEffect(() => { load() }, [id])

  const triggerDraw = async () => {
    if (!confirm('Trigger the draw now? This will lock the lottery and assign winners.')) return
    setTriggering(true)
    const res = await fetch(`/api/admin/lotteries/${id}/trigger`, { method: 'POST' })
    const data = await res.json()
    setTriggering(false)
    setMsg(data.ok ? `Draw done! ${data.winnerCount} winners selected, ₹${data.prizePool?.toLocaleString('en-IN')} prize pool.` : data.error)
    load()
  }

  if (!lottery) return <div className="text-gray-500 py-12 text-center">Loading...</div>

  const approved = lottery.tickets.filter(t => t.utrStatus === 'APPROVED')
  const pending = lottery.tickets.filter(t => t.utrStatus === 'PENDING')
  const totalPool = approved.length * lottery.ticketPrice
  const prizePool = totalPool * (lottery.poolPercent / 100)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/lotteries" className="text-gray-600 hover:text-gray-400 text-sm">← Lotteries</Link>
        <h1 className="text-2xl font-black text-white flex-1">{lottery.name}</h1>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
          lottery.status === 'ACTIVE' ? 'bg-purple-500/20 text-purple-300' :
          lottery.status === 'SCRATCH_OPEN' ? 'bg-green-500/20 text-green-400' :
          'bg-gray-700 text-gray-500'
        }`}>{lottery.status}</span>
      </div>

      {msg && <div className="mb-4 bg-green-900/20 border border-green-700/40 rounded-xl px-4 py-3 text-green-400 text-sm">{msg}</div>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="card p-5 space-y-3">
          <h3 className="text-gold-400 font-bold">Stats</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Ticket Price', `₹${lottery.ticketPrice}`],
              ['Max Participants', lottery.maxParticipants],
              ['Approved Tickets', approved.length],
              ['Pending Verification', pending.length],
              ['Total Collected', `₹${totalPool.toLocaleString('en-IN')}`],
              ['Prize Pool', `₹${prizePool.toLocaleString('en-IN')}`],
              ['Win %', `${lottery.winPercent}%`],
              ['Pool %', `${lottery.poolPercent}%`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-900 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>

          {lottery.status === 'ACTIVE' && (
            <button
              onClick={triggerDraw}
              disabled={triggering || approved.length === 0}
              className="btn-gold w-full py-3 rounded-xl font-black mt-2 disabled:opacity-40"
            >
              {triggering ? 'Triggering Draw...' : '🎲 Trigger Draw Now'}
            </button>
          )}
          {approved.length === 0 && lottery.status === 'ACTIVE' && (
            <div className="text-yellow-600 text-xs text-center">No approved tickets yet</div>
          )}
        </div>

        {/* Winning numbers (after draw) */}
        <div className="card p-5">
          <h3 className="text-gold-400 font-bold mb-3">Winning Numbers</h3>
          {lottery.winningNumbers.length === 0 ? (
            <div className="text-gray-700 text-sm text-center py-6">Draw not triggered yet</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lottery.winningNumbers.map(w => (
                <div key={w.id} className="flex items-center gap-3 text-sm border-b border-gray-900 pb-2">
                  <span className="font-mono font-black text-white">#{w.number}</span>
                  <span className="flex-1 text-gray-500">{w.tierName}</span>
                  <span className="text-gold-400">₹{w.prizeAmount.toLocaleString('en-IN')}</span>
                  {w.winnerName && <span className="text-green-400 text-xs font-bold">{w.winnerName}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets */}
        <div className="card p-5 md:col-span-2">
          <h3 className="text-gold-400 font-bold mb-3">All Tickets ({lottery.tickets.length})</h3>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th><th>UTR</th><th>Status</th><th>Winner</th><th>Prize</th><th>Payout</th>
                </tr>
              </thead>
              <tbody>
                {lottery.tickets.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="text-white text-sm font-medium">{t.user.name}</div>
                      <div className="text-gray-600 text-xs">{t.user.email}</div>
                    </td>
                    <td><span className="font-mono text-xs text-gray-400">{t.utrNumber}</span></td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.utrStatus === 'PENDING' ? 'badge-pending' :
                        t.utrStatus === 'APPROVED' ? 'badge-approved' : 'badge-rejected'
                      }`}>{t.utrStatus}</span>
                    </td>
                    <td>{t.isWinner === null ? '—' : t.isWinner ? '✅' : '❌'}</td>
                    <td className="text-gold-400 font-bold">{t.prizeAmount ? `₹${t.prizeAmount.toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      <span className={`text-xs ${t.payoutStatus === 'PAID' ? 'text-green-400' : t.payoutStatus === 'CLAIMED' ? 'text-yellow-400' : 'text-gray-600'}`}>
                        {t.payoutStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
