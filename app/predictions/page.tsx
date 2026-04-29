import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 10

function calcOdds(bets: { option: string; amount: number }[]) {
  const poolA = bets.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
  const poolB = bets.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
  const total = poolA + poolB
  const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50
  const pctB = 100 - pctA
  return { poolA, poolB, total, pctA, pctB }
}

export default async function PredictionsPage() {
  const questions = await prisma.question.findMany({
    include: {
      bets: { where: { utrStatus: 'APPROVED' }, select: { option: true, amount: true } },
      _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const open = questions.filter(q => q.status === 'OPEN')
  const resolved = questions.filter(q => q.status === 'RESOLVED')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-purple-400 text-xs font-bold mb-4 uppercase tracking-widest">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          Live Prediction Markets
        </div>
        <h1 className="text-5xl font-black mb-3">
          <span className="text-white">Predict &</span>{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Win</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Pick the right outcome, back it with money, earn from the pool. Only 5% house fee.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-4 gap-3 mb-10">
        {[
          { icon: '❓', title: 'Pick a Question', desc: 'Browse live predictions' },
          { icon: '💰', title: 'Place Your Bet', desc: 'Choose amount, pay UPI' },
          { icon: '⏳', title: 'Wait for Result', desc: 'Admin resolves the outcome' },
          { icon: '🏆', title: 'Collect Winnings', desc: 'Winners split 95% of pool' },
        ].map(s => (
          <div key={s.title} className="card p-4 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-white font-bold text-xs">{s.title}</div>
            <div className="text-gray-600 text-xs mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Open markets */}
      {open.length > 0 && (
        <>
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            Open Markets
          </h2>
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {open.map(q => {
              const { poolA, poolB, total, pctA, pctB } = calcOdds(q.bets)
              return (
                <Link key={q.id} href={`/predictions/${q.id}`}>
                  <div className="group card p-5 hover:border-purple-600/50 hover:shadow-[0_0_25px_rgba(124,58,237,0.15)] transition-all duration-300 cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">OPEN</span>
                      <span className="text-gray-600 text-xs">House: {q.commission}%</span>
                    </div>

                    <h3 className="text-white font-black text-lg mb-4 leading-tight group-hover:text-purple-300 transition-colors">
                      {q.question}
                    </h3>

                    {/* Option bars */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 text-green-400 font-bold text-sm truncate">{q.optionA}</div>
                        <div className="flex-1 h-7 bg-gray-900 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-700 rounded-lg"
                            style={{ width: `${pctA}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-black">{pctA}%</span>
                        </div>
                        <div className="w-20 text-right text-xs text-gray-500">₹{poolA.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 text-red-400 font-bold text-sm truncate">{q.optionB}</div>
                        <div className="flex-1 h-7 bg-gray-900 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-700 rounded-lg"
                            style={{ width: `${pctB}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-black">{pctB}%</span>
                        </div>
                        <div className="w-20 text-right text-xs text-gray-500">₹{poolB.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-gray-900">
                      <span>{q._count.bets} bettors</span>
                      <span className="text-gold-500 font-bold">Total Pool: ₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {/* Resolved markets */}
      {resolved.length > 0 && (
        <>
          <h2 className="text-xl font-black text-white mb-4 text-gray-500">Resolved Markets</h2>
          <div className="space-y-3">
            {resolved.map(q => {
              const { total } = calcOdds(q.bets)
              return (
                <Link key={q.id} href={`/predictions/${q.id}`}>
                  <div className="card p-4 opacity-70 hover:opacity-100 transition-opacity flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">{q.question}</div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Resolved: <span className={q.winningOption === 'A' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                          {q.winningOption === 'A' ? q.optionA : q.optionB}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-600 text-xs">Pool</div>
                      <div className="text-gold-500 font-bold text-sm">₹{total.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}

      {questions.length === 0 && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🔮</div>
          <div className="text-gray-400 text-lg font-bold">No predictions yet</div>
          <div className="text-gray-600 text-sm mt-2">Check back soon!</div>
        </div>
      )}
    </div>
  )
}
