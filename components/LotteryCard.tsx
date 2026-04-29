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
  prizeTiers: { tierName: string; amount: number; rank: number }[]
  _count: { tickets: number }
}

export default function LotteryCard({ lottery }: { lottery: Lottery }) {
  const filled = lottery._count.tickets
  const max = lottery.maxParticipants
  const pct = Math.round((filled / max) * 100)
  const spotsLeft = max - filled
  const topPrize = lottery.prizeTiers[0]?.amount ?? 0
  const isOpen = lottery.status === 'SCRATCH_OPEN'
  const isCompleted = lottery.status === 'COMPLETED'

  const urgency = pct >= 90 ? 'ALMOST FULL!' : pct >= 70 ? 'FILLING FAST' : pct >= 40 ? 'JOIN NOW' : 'JUST OPENED'
  const urgencyColor = pct >= 90 ? 'text-red-400 animate-pulse' : pct >= 70 ? 'text-orange-400' : 'text-green-400'

  return (
    <Link href={`/lottery/${lottery.id}`}>
      <div className="group relative bg-card-gradient border border-purple-900/50 rounded-2xl p-5 hover:border-gold-500/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] cursor-pointer overflow-hidden">
        {/* Shimmer on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-gold-500/5 to-transparent" />

        {/* Status badge */}
        <div className="flex justify-between items-start mb-3">
          <span className={`text-xs font-black px-2 py-1 rounded-full ${
            isOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            isCompleted ? 'bg-gray-500/20 text-gray-400' :
            'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {isOpen ? '🟢 SCRATCH OPEN' : isCompleted ? 'COMPLETED' : '🎯 ACTIVE'}
          </span>
          {!isCompleted && !isOpen && (
            <span className={`text-xs font-black ${urgencyColor}`}>{urgency}</span>
          )}
        </div>

        <h3 className="text-white font-black text-xl mb-1 group-hover:text-gold-400 transition-colors">{lottery.name}</h3>
        {lottery.description && <p className="text-gray-500 text-xs mb-3 line-clamp-1">{lottery.description}</p>}

        {/* Prize highlight */}
        {topPrize > 0 && (
          <div className="mb-4 bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs uppercase tracking-widest">Top Prize</div>
            <div className="text-gold-400 font-black text-2xl animate-glow">₹{topPrize.toLocaleString('en-IN')}</div>
          </div>
        )}

        <div className="flex justify-between text-sm mb-3">
          <span className="text-gray-400">Ticket Price</span>
          <span className="text-white font-bold">₹{lottery.ticketPrice.toLocaleString('en-IN')}</span>
        </div>

        {!isCompleted && !isOpen && (
          <>
            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{filled} joined</span>
                <span className={spotsLeft <= 20 ? 'text-red-400 font-bold' : 'text-gray-500'}>
                  {spotsLeft} spots left
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90
                      ? 'linear-gradient(90deg, #EF4444, #F97316)'
                      : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-gray-600 text-center">{pct}% full</div>
          </>
        )}

        <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-600">
          <span>{lottery.winPercent}% winners</span>
          <span>{lottery.poolPercent}% prize pool</span>
        </div>
      </div>
    </Link>
  )
}
