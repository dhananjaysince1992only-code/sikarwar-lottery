'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface PrizeTier {
  id: string; tierName: string; winnerCount: number; amount: number; rank: number
}

interface Lottery {
  id: string; name: string; description: string; ticketPrice: number; maxParticipants: number
  winPercent: number; poolPercent: number; status: string; scratchDelay: number
  upiId: string; qrImage: string
  prizeTiers: PrizeTier[]
  winningNumbers: { id: string; number: string; prizeAmount: number; tierName: string; winnerName: string }[]
  tickets: { id: string; utrNumber: string; utrStatus: string; user: { name: string; email: string }; isWinner: boolean | null; prizeAmount: number | null; scratchedAt: string | null; payoutStatus: string }[]
}

export default function AdminLotteryDetail() {
  const { id } = useParams()
  const [lottery, setLottery] = useState<Lottery | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')

  const load = async () => {
    const res = await fetch(`/api/admin/lotteries/${id}`)
    const data = await res.json()
    setLottery(data)
  }

  useEffect(() => { load() }, [id])

  const triggerDraw = async () => {
    if (!lottery) return
    const isFull = approved.length >= lottery.maxParticipants
    const scaleFactor = approved.length / lottery.maxParticipants
    const scaledPool = Math.round(fullPrizePool * scaleFactor)

    const confirmMsg = isFull
      ? `Trigger draw for ${approved.length} participants? Prize pool: ₹${fullPrizePool.toLocaleString('en-IN')}. This cannot be undone.`
      : `Only ${approved.length}/${lottery.maxParticipants} slots filled.\n\nPrize pool will be ₹${scaledPool.toLocaleString('en-IN')} (proportional to ${Math.round(scaleFactor * 100)}% fill).\n\nProceed with partial draw?`

    if (!confirm(confirmMsg)) return
    setTriggering(true)
    const res = await fetch(`/api/admin/lotteries/${id}/trigger`, { method: 'POST' })
    const data = await res.json()
    setTriggering(false)
    if (data.ok) {
      setMsgType('ok')
      setMsg(`Draw complete! ${data.winnerCount} winners selected. Prize pool: ₹${data.prizePool?.toLocaleString('en-IN')}.`)
    } else {
      setMsgType('err')
      setMsg(data.error)
    }
    load()
  }

  if (!lottery) return <div className="text-gray-500 py-12 text-center">Loading...</div>

  const approved = lottery.tickets.filter(t => t.utrStatus === 'APPROVED')
  const pending = lottery.tickets.filter(t => t.utrStatus === 'PENDING')
  const totalPool = approved.length * lottery.ticketPrice
  const fullPrizePool = lottery.maxParticipants * lottery.ticketPrice * (lottery.poolPercent / 100)
  const actualPrizePool = totalPool * (lottery.poolPercent / 100)
  const scaleFactor = lottery.maxParticipants > 0 ? approved.length / lottery.maxParticipants : 0
  const isFull = approved.length >= lottery.maxParticipants
  const fillPct = Math.round(scaleFactor * 100)
  // Same formula as engine: each tier scales so all tiers together = actual prize pool
  const configuredTotal = lottery.prizeTiers.reduce((s, t) => s + t.amount * t.winnerCount, 0)

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

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm border ${
          msgType === 'ok'
            ? 'bg-green-900/20 border-green-700/40 text-green-400'
            : 'bg-red-900/20 border-red-700/40 text-red-400'
        }`}>{msg}</div>
      )}

      {/* Partial fill warning */}
      {lottery.status === 'ACTIVE' && !isFull && approved.length > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <div>
              <div className="text-yellow-400 font-bold text-sm mb-1">Lottery not yet full — {approved.length}/{lottery.maxParticipants} slots filled ({fillPct}%)</div>
              <div className="text-gray-400 text-xs leading-relaxed">
                You can still trigger a draw now. Prizes will be scaled proportionally:<br />
                Full prize pool: <span className="text-white font-bold">₹{fullPrizePool.toLocaleString('en-IN')}</span> →
                Actual (at {fillPct}% fill): <span className="text-yellow-400 font-bold">₹{Math.round(actualPrizePool).toLocaleString('en-IN')}</span>
              </div>
              {lottery.prizeTiers.length > 0 && (
                <div className="mt-2 space-y-1">
                  {lottery.prizeTiers.map(tier => (
                    <div key={tier.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500 w-24 truncate">{tier.tierName}</span>
                      <span className="text-gray-600 line-through">₹{tier.amount.toLocaleString('en-IN')}</span>
                      <span className="text-yellow-400 font-bold">→ ₹{(configuredTotal > 0 ? Math.floor((tier.amount / configuredTotal) * actualPrizePool) : 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="card p-5 space-y-3">
          <h3 className="text-gold-400 font-bold">Stats</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Ticket Price', `₹${lottery.ticketPrice}`],
              ['Max Participants', lottery.maxParticipants],
              ['Approved Tickets', `${approved.length} / ${lottery.maxParticipants}`],
              ['Pending Verification', pending.length],
              ['Total Collected', `₹${totalPool.toLocaleString('en-IN')}`],
              ['Actual Prize Pool', `₹${Math.round(actualPrizePool).toLocaleString('en-IN')}`],
              ['Full Prize Pool', `₹${Math.round(fullPrizePool).toLocaleString('en-IN')}`],
              ['Win %', `${lottery.winPercent}%`],
              ['Pool %', `${lottery.poolPercent}%`],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between border-b border-gray-900 pb-2">
                <span className="text-gray-500">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>

          {/* Fill bar */}
          {lottery.status === 'ACTIVE' && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Slots filled</span>
                <span>{fillPct}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isFull ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${Math.min(fillPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {lottery.status === 'ACTIVE' && (
            <button
              onClick={triggerDraw}
              disabled={triggering || approved.length === 0}
              className={`w-full py-3 rounded-xl font-black mt-2 disabled:opacity-40 ${
                isFull ? 'btn-gold' : 'bg-yellow-600/20 border border-yellow-500/40 text-yellow-400 hover:bg-yellow-600/30 transition-colors'
              }`}
            >
              {triggering
                ? 'Running Draw...'
                : isFull
                  ? '🎲 Trigger Draw Now'
                  : `⚡ Force Draw (${fillPct}% filled)`}
            </button>
          )}
          {approved.length === 0 && lottery.status === 'ACTIVE' && (
            <div className="text-yellow-600 text-xs text-center">No approved tickets yet — draw cannot run</div>
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
