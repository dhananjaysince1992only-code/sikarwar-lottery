import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import WinnersBoard from '@/components/WinnersBoard'
import JoinForm from './JoinForm'

export const revalidate = 5

async function getLottery(id: string) {
  return prisma.lottery.findUnique({
    where: { id },
    include: {
      prizeTiers: { orderBy: { rank: 'asc' } },
      winningNumbers: { orderBy: { rank: 'asc' } },
      _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
    },
  })
}

export default async function LotteryPage({ params }: { params: { id: string } }) {
  const [lottery, session] = await Promise.all([getLottery(params.id), getSession()])
  if (!lottery) notFound()

  const filled = lottery._count.tickets
  const max = lottery.maxParticipants
  const pct = Math.round((filled / max) * 100)
  const spotsLeft = max - filled
  const totalPool = filled * lottery.ticketPrice
  const prizePool = totalPool * (lottery.poolPercent / 100)

  const isActive = lottery.status === 'ACTIVE'
  const isScratchOpen = lottery.status === 'SCRATCH_OPEN'
  const isCompleted = lottery.status === 'COMPLETED'

  const scratchReady = isScratchOpen && (!lottery.scratchOpenAt || new Date() >= lottery.scratchOpenAt)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-xs font-black px-3 py-1 rounded-full ${
            isScratchOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            isCompleted ? 'bg-gray-700 text-gray-400' :
            'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}>
            {isScratchOpen ? '🟢 SCRATCH OPEN' : isCompleted ? 'COMPLETED' : '🎯 ACTIVE'}
          </span>
        </div>
        <h1 className="text-4xl font-black text-white mb-2">{lottery.name}</h1>
        {lottery.description && <p className="text-gray-400">{lottery.description}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Prize tiers */}
          <div className="card p-5">
            <h3 className="text-gold-400 font-black text-lg mb-4 flex items-center gap-2">🏆 Prize Structure</h3>
            <div className="space-y-3">
              {lottery.prizeTiers.map((tier, i) => (
                <div key={tier.id} className="flex items-center justify-between py-2 border-b border-gray-900 last:border-0">
                  <div>
                    <span className={`text-sm font-bold ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-gray-300' : 'text-gray-400'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎖️'} {tier.tierName}
                    </span>
                    <div className="text-gray-600 text-xs">{tier.winnerCount} winner{tier.winnerCount > 1 ? 's' : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-black">₹{tier.amount.toLocaleString('en-IN')}</div>
                    <div className="text-gray-700 text-xs">per winner</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800 space-y-1 text-xs text-gray-600">
              <div className="flex justify-between"><span>Win rate</span><span className="text-gray-400">{lottery.winPercent}% of participants</span></div>
              <div className="flex justify-between"><span>Prize pool</span><span className="text-gray-400">{lottery.poolPercent}% of total collected</span></div>
              <div className="flex justify-between"><span>Current prize pool</span><span className="text-green-400 font-bold">₹{prizePool.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {/* Progress */}
          {(isActive || isScratchOpen) && (
            <div className="card p-5">
              <h3 className="text-white font-bold mb-3">Participants</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">{filled} joined</span>
                <span className={spotsLeft <= 10 ? 'text-red-400 font-bold animate-pulse' : 'text-gray-500'}>
                  {spotsLeft} spots left
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90 ? 'linear-gradient(90deg, #EF4444, #F97316)' : 'linear-gradient(90deg, #7C3AED, #EC4899)',
                  }}
                />
              </div>
              <div className="text-center text-xs text-gray-600 mt-1">{pct}% full</div>
            </div>
          )}

          {/* Scratch delay notice */}
          {isScratchOpen && !scratchReady && lottery.scratchOpenAt && (
            <div className="card p-4 border-yellow-500/30 bg-yellow-500/5 text-center">
              <div className="text-yellow-400 font-bold text-sm">⏳ Scratch opens at</div>
              <div className="text-white font-black text-lg mt-1">
                {new Date(lottery.scratchOpenAt).toLocaleTimeString('en-IN')}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Join form */}
          {isActive && (
            <JoinForm
              lotteryId={lottery.id}
              ticketPrice={lottery.ticketPrice}
              upiId={lottery.upiId}
              qrImage={lottery.qrImage}
              loggedIn={!!session}
            />
          )}

          {/* Scratch open notice */}
          {isScratchOpen && scratchReady && (
            <div className="card p-5 border-green-500/30 bg-green-500/5 text-center">
              <div className="text-4xl mb-2">🎰</div>
              <div className="text-green-400 font-black text-xl">Scratch is OPEN!</div>
              <div className="text-gray-400 text-sm mt-1">Go to My Tickets to scratch your card</div>
              <a href="/tickets" className="btn-gold inline-block mt-4 px-6 py-2.5 rounded-xl text-sm font-black">
                Go to My Tickets →
              </a>
            </div>
          )}

          {/* Winners board */}
          {(isScratchOpen || isCompleted) && (
            <WinnersBoard lotteryId={lottery.id} />
          )}
        </div>
      </div>
    </div>
  )
}
