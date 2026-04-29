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
  const commission = total * (question.commission / 100)
  const prizePool = total - commission

  const userBet = session ? question.bets.find(b => b.userId === session.id) : null
  const isResolved = question.status === 'RESOLVED'
  const winnerOption = question.winningOption

  // If user won and is resolved, show their payout
  const userIsWinner = userBet && isResolved && userBet.option === winnerOption
  const winnerPool = question.bets.filter(b => b.option === winnerOption).reduce((s, b) => s + b.amount, 0)
  const userPayout = userBet && userIsWinner && winnerPool > 0
    ? Math.round((userBet.amount / winnerPool) * prizePool * 100) / 100
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Status */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-black px-3 py-1 rounded-full ${
          isResolved ? 'bg-gray-700 text-gray-400' : 'bg-green-500/20 text-green-400 border border-green-500/30'
        }`}>
          {isResolved ? 'RESOLVED' : '🟢 OPEN'}
        </span>
        <span className="text-gray-600 text-xs">House fee: {question.commission}%</span>
      </div>

      {/* Question */}
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight">{question.question}</h1>
      {question.description && <p className="text-gray-400 mb-6">{question.description}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Odds & Pool */}
        <div className="space-y-5">
          {/* Option bars */}
          <div className="card p-5">
            <h3 className="text-gray-400 font-bold text-sm mb-4 uppercase tracking-widest">Current Odds</h3>

            <div className="space-y-4">
              {/* Option A */}
              <div className={`rounded-2xl p-4 border-2 transition-all ${
                isResolved && winnerOption === 'A'
                  ? 'border-green-500/60 bg-green-500/10'
                  : 'border-gray-800 bg-casino-950'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isResolved && winnerOption === 'A' && <span className="text-green-400">✓</span>}
                    <span className="text-white font-black text-lg">{question.optionA}</span>
                  </div>
                  <span className="text-2xl font-black text-green-400">{pctA}%</span>
                </div>
                <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-700 to-green-500 transition-all duration-700"
                    style={{ width: `${pctA}%` }}
                  />
                </div>
                <div className="text-gray-500 text-xs mt-1.5">
                  ₹{poolA.toLocaleString('en-IN')} bet · {question.bets.filter(b => b.option === 'A').length} people
                </div>
              </div>

              {/* Option B */}
              <div className={`rounded-2xl p-4 border-2 transition-all ${
                isResolved && winnerOption === 'B'
                  ? 'border-red-500/60 bg-red-500/10'
                  : 'border-gray-800 bg-casino-950'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isResolved && winnerOption === 'B' && <span className="text-red-400">✓</span>}
                    <span className="text-white font-black text-lg">{question.optionB}</span>
                  </div>
                  <span className="text-2xl font-black text-red-400">{pctB}%</span>
                </div>
                <div className="h-3 bg-gray-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700"
                    style={{ width: `${pctB}%` }}
                  />
                </div>
                <div className="text-gray-500 text-xs mt-1.5">
                  ₹{poolB.toLocaleString('en-IN')} bet · {question.bets.filter(b => b.option === 'B').length} people
                </div>
              </div>
            </div>

            {/* Pool summary */}
            <div className="mt-4 pt-4 border-t border-gray-900 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Total pool</span><span className="text-white font-bold">₹{total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>House fee ({question.commission}%)</span>
                <span className="text-gray-400">₹{commission.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Prize pool (95%)</span>
                <span className="text-green-400 font-bold">₹{prizePool.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Payout calculator */}
          {!isResolved && total > 0 && (
            <div className="card p-4 border-purple-700/30">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">If you bet ₹100 on {question.optionA}...</div>
              <div className="text-white font-bold text-sm">
                Potential return: ₹{poolA > 0
                  ? Math.round((100 / (poolA + 100)) * (prizePool + 100 * (1 - question.commission / 100))).toLocaleString('en-IN')
                  : Math.round(prizePool + 100 * 0.95).toLocaleString('en-IN')
                }
              </div>
              <div className="text-gray-700 text-xs mt-1">Based on current pool — changes as more people bet</div>
            </div>
          )}

          {/* Winner result */}
          {isResolved && (
            <div className={`card p-5 text-center ${winnerOption === 'A' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="text-3xl mb-2">🏁</div>
              <div className="text-gray-400 text-sm">Winning outcome</div>
              <div className={`font-black text-2xl mt-1 ${winnerOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                {winnerOption === 'A' ? question.optionA : question.optionB}
              </div>
            </div>
          )}
        </div>

        {/* Right: Bet form */}
        <div>
          {/* My bet result */}
          {userBet && isResolved && (
            <div className={`card p-5 mb-4 text-center ${userIsWinner ? 'border-gold-500/40 bg-gold-500/5' : 'border-gray-700'}`}>
              {userIsWinner ? (
                <>
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="text-gold-400 font-black text-xl">You Won!</div>
                  <div className="text-white font-black text-3xl mt-1">₹{userPayout.toLocaleString('en-IN')}</div>
                  <BetForm
                    questionId={question.id}
                    isOpen={false}
                    loggedIn={!!session}
                    upiId={question.upiId}
                    qrImage={question.qrImage}
                    optionA={question.optionA}
                    optionB={question.optionB}
                    userBet={userBet}
                    showClaimOnly
                    userPayout={userPayout}
                  />
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">😔</div>
                  <div className="text-gray-400 font-bold">Better luck next time</div>
                  <div className="text-gray-600 text-sm mt-1">
                    You bet ₹{userBet.amount} on {userBet.option === 'A' ? question.optionA : question.optionB}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active bet form */}
          {!isResolved && (
            <BetForm
              questionId={question.id}
              isOpen={question.status === 'OPEN'}
              loggedIn={!!session}
              upiId={question.upiId}
              qrImage={question.qrImage}
              optionA={question.optionA}
              optionB={question.optionB}
              userBet={userBet ?? null}
              showClaimOnly={false}
              userPayout={0}
            />
          )}
        </div>
      </div>
    </div>
  )
}
