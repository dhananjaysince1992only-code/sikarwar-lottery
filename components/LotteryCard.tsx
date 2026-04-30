'use client'
import Link from 'next/link'

interface Lottery {
  id: string
  name: string
  description: string
  ticketPrice: number
  maxParticipants: number
  winPercent: number
  poolPercent: number
  status: string
  prizeTiers: { tierName: string; amount: number; rank: number; winnerCount: number }[]
  _count: { tickets: number }
}

export default function LotteryCard({ lottery, loggedIn }: { lottery: Lottery; loggedIn: boolean }) {
  const filled = lottery._count.tickets
  const max = lottery.maxParticipants
  const pct = Math.min(100, Math.round((filled / max) * 100))
  const spotsLeft = Math.max(0, max - filled)
  const topPrize = lottery.prizeTiers[0]?.amount ?? 0
  const isOpen = lottery.status === 'SCRATCH_OPEN'
  const isCompleted = lottery.status === 'COMPLETED'

  const fillColor = pct >= 90 ? '#EF4444' : pct >= 60 ? '#F97316' : '#7C3AED'

  return (
    <div className="group relative rounded-2xl overflow-hidden border border-white/8 bg-gradient-to-b from-white/5 to-transparent hover:border-yellow-500/30 transition-all duration-200 flex flex-col">
      {/* Top accent */}
      <div className={`h-0.5 w-full ${isOpen ? 'bg-green-500' : isCompleted ? 'bg-gray-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`} />

      <div className="p-4 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
            isOpen ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
            isCompleted ? 'bg-white/5 text-gray-500' :
            'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          }`}>
            {isOpen ? 'Scratch Open' : isCompleted ? 'Completed' : 'Active'}
          </span>
          {topPrize > 0 && !isCompleted && (
            <span className="text-gold-400 font-black text-sm">₹{topPrize.toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-white font-black text-base mb-1 group-hover:text-gold-400 transition-colors leading-tight">
          {lottery.name}
        </h3>
        {lottery.description && (
          <p className="text-gray-500 text-xs mb-3 line-clamp-1">{lottery.description}</p>
        )}

        {/* Prize tiers */}
        {lottery.prizeTiers.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {lottery.prizeTiers.slice(0, 3).map(tier => (
              <div key={tier.rank} className="flex justify-between items-center">
                <span className="text-gray-500 text-xs">{tier.tierName} <span className="text-gray-700">×{tier.winnerCount}</span></span>
                <span className="text-white text-xs font-bold">₹{tier.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ticket price */}
        <div className="flex justify-between items-center py-2 border-t border-white/5 mb-3">
          <span className="text-gray-500 text-xs">Ticket price</span>
          <span className="text-white font-black text-sm">₹{lottery.ticketPrice.toLocaleString('en-IN')}</span>
        </div>

        {/* Progress bar */}
        {!isCompleted && !isOpen && (
          <div className="mb-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>{filled}/{max} sold</span>
              <span className={spotsLeft <= 20 ? 'text-red-400 font-bold' : ''}>{spotsLeft} left</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          {isCompleted ? (
            <Link href={`/lottery/${lottery.id}`} className="block text-center py-2.5 rounded-xl text-xs font-bold text-gray-500 border border-white/8 hover:border-white/15 transition-all">
              View Results
            </Link>
          ) : isOpen ? (
            <Link href={loggedIn ? `/lottery/${lottery.id}` : '/register'} className="block text-center py-2.5 rounded-xl text-sm font-black text-white bg-green-600/30 border border-green-500/40 hover:bg-green-600/40 transition-all">
              Scratch Card →
            </Link>
          ) : (
            <Link href={loggedIn ? `/lottery/${lottery.id}` : '/register'} className="btn-gold block text-center py-2.5 rounded-xl text-sm font-black">
              Buy Ticket →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
