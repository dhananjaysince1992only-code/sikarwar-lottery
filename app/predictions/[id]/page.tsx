import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound } from 'next/navigation'
import BetForm from './BetForm'

export const revalidate = 5

export default async function PredictionPage({ params }: { params: { id: string } }) {
  const [question, session] = await Promise.all([
    prisma.question.findUnique({
      where: { id: params.id },
      include: {
        bets: {
          where: { utrStatus: 'APPROVED' },
          select: { option: true, amount: true, userId: true },
        },
      },
    }),
    getSession(),
  ])

  if (!question) notFound()

  const poolA = question.bets.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
  const poolB = question.bets.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
  const total = poolA + poolB
  const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50
  const pctB = 100 - pctA
  const commission = question.commission
  const prizePool = total * (1 - commission / 100)

  // Implied multipliers (how much ₹1 returns if that side wins)
  const multA = poolA > 0 ? Math.round((total * (1 - commission / 100) / poolA) * 100) / 100 : 0
  const multB = poolB > 0 ? Math.round((total * (1 - commission / 100) / poolB) * 100) / 100 : 0

  // All user bets on this question (including pending UTR)
  const userBets = session ? await prisma.questionBet.findMany({
    where: { questionId: params.id, userId: session.id, utrStatus: { not: 'REJECTED' } },
    select: { id: true, option: true, amount: true, utrStatus: true },
    orderBy: { createdAt: 'desc' },
  }) : []

  const isResolved = question.status === 'RESOLVED'
  const winnerOption = question.winningOption

  // User payout if resolved and winner
  const userWinnerBets = userBets.filter(b => b.option === winnerOption && b.utrStatus === 'APPROVED')
  const userWinnerTotal = userWinnerBets.reduce((s, b) => s + b.amount, 0)
  const winnerPool = question.bets.filter(b => b.option === winnerOption).reduce((s, b) => s + b.amount, 0)
  const userPayout = isResolved && userWinnerTotal > 0 && winnerPool > 0
    ? Math.round((userWinnerTotal / winnerPool) * prizePool * 100) / 100
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Status */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          isResolved ? 'bg-white/5 text-gray-400' : 'bg-green-500/15 text-green-400 border border-green-500/20'
        }`}>
          {isResolved ? 'Resolved' : '● Live'}
        </span>
        <span className="text-gray-600 text-xs">{question.bets.length} bets total</span>
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-white mb-6 leading-snug">{question.question}</h1>

      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        {/* Left: Odds */}
        <div className="space-y-4">
          {/* Option cards */}
          <div className="space-y-3">
            {[
              { key: 'A', label: question.optionA, pool: poolA, pct: pctA, mult: multA, color: 'green' },
              { key: 'B', label: question.optionB, pool: poolB, pct: pctB, mult: multB, color: 'red' },
            ].map(opt => {
              const isWinner = isResolved && winnerOption === opt.key
              return (
                <div key={opt.key} className={`rounded-2xl p-4 border-2 transition-all ${
                  isWinner
                    ? opt.color === 'green' ? 'border-green-500/50 bg-green-500/8' : 'border-red-500/50 bg-red-500/8'
                    : 'border-white/8 bg-white/2'
                }`}>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                      {isWinner && <span className={opt.color === 'green' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'}>✓</span>}
                      <span className="text-white font-black text-base">{opt.label}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-black ${opt.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>{opt.pct}%</span>
                      {opt.mult > 0 && !isResolved && (
                        <div className="text-xs text-gray-500">{opt.mult}× payout</div>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className={`h-full rounded-full transition-all duration-700 ${opt.color === 'green' ? 'bg-gradient-to-r from-green-700 to-green-500' : 'bg-gradient-to-r from-red-700 to-red-500'}`}
                      style={{ width: `${opt.pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₹{opt.pool.toLocaleString('en-IN')} in pool</span>
                    <span>{question.bets.filter(b => b.option === opt.key).length} bettors</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pool breakdown */}
          <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 space-y-1.5">
            {[
              { label: 'Total pool', value: `₹${total.toLocaleString('en-IN')}`, color: 'text-white' },
              { label: `House fee (${commission}%)`, value: `₹${(total * commission / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-gray-500' },
              { label: 'Prize pool', value: `₹${prizePool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-green-400' },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{row.label}</span>
                <span className={`font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Winner banner */}
          {isResolved && (
            <div className={`rounded-2xl p-5 text-center border ${winnerOption === 'A' ? 'border-green-500/30 bg-green-500/8' : 'border-red-500/30 bg-red-500/8'}`}>
              <div className="text-2xl mb-1">🏁</div>
              <div className="text-gray-400 text-xs mb-1">Winning outcome</div>
              <div className={`font-black text-xl ${winnerOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                {winnerOption === 'A' ? question.optionA : question.optionB}
              </div>
            </div>
          )}

          {/* User's existing bets summary */}
          {userBets.length > 0 && (
            <div className="rounded-xl border border-white/8 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/5 text-xs text-gray-500 font-bold uppercase tracking-wide">Your Bets</div>
              {userBets.map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between border-b border-white/4 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${b.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                      {b.option === 'A' ? question.optionA : question.optionB}
                    </span>
                    {b.utrStatus === 'PENDING' && (
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">Pending</span>
                    )}
                    {b.utrStatus === 'APPROVED' && (
                      <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">Confirmed</span>
                    )}
                  </div>
                  <span className="text-white font-bold text-sm">₹{b.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          {/* User won */}
          {isResolved && userPayout > 0 && (
            <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 text-center">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-gold-400 font-black text-xl">You Won!</div>
              <div className="text-white font-black text-3xl mt-1">₹{userPayout.toLocaleString('en-IN')}</div>
              <BetForm
                questionId={question.id} isOpen={false} loggedIn={!!session}
                upiId={question.upiId} qrImage={question.qrImage}
                optionA={question.optionA} optionB={question.optionB}
                showClaimOnly userPayout={userPayout}
                poolA={poolA} poolB={poolB} total={total} commission={commission}
              />
            </div>
          )}

          {/* User lost */}
          {isResolved && userBets.length > 0 && userPayout === 0 && (
            <div className="rounded-2xl border border-white/8 p-5 text-center">
              <div className="text-2xl mb-2">😔</div>
              <div className="text-gray-400 font-bold">Better luck next time</div>
            </div>
          )}
        </div>

        {/* Right: Bet form */}
        {!isResolved && (
          <div>
            <BetForm
              questionId={question.id} isOpen={question.status === 'OPEN'} loggedIn={!!session}
              upiId={question.upiId} qrImage={question.qrImage}
              optionA={question.optionA} optionB={question.optionB}
              showClaimOnly={false} userPayout={0}
              poolA={poolA} poolB={poolB} total={total} commission={commission}
            />
          </div>
        )}
      </div>
    </div>
  )
}
