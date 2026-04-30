import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 10

function calcOdds(bets: { option: string; amount: number }[]) {
  const poolA = bets.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
  const poolB = bets.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
  const total = poolA + poolB
  const pctA = total > 0 ? Math.round((poolA / total) * 100) : 50
  return { poolA, poolB, total, pctA, pctB: 100 - pctA }
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-1">Prediction Markets</h1>
        <p className="text-gray-500 text-sm">Pick the right outcome, back it with money. 95% of pool goes to winners.</p>
      </div>

      {/* How it works — compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
        {[
          { icon: '🔮', title: 'Pick', desc: 'Choose a side' },
          { icon: '💳', title: 'Pay UPI', desc: 'Send your amount' },
          { icon: '⏳', title: 'Wait', desc: 'Admin resolves' },
          { icon: '💰', title: 'Win', desc: '95% pool split' },
        ].map(s => (
          <div key={s.title} className="rounded-xl bg-white/3 border border-white/6 p-3 text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-white font-bold text-xs">{s.title}</div>
            <div className="text-gray-600 text-[10px] mt-0.5">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Open markets */}
      {open.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-base font-black text-white">Live Markets</h2>
            <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">{open.length}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {open.map(q => {
              const { poolA, poolB, total, pctA, pctB } = calcOdds(q.bets)
              return (
                <Link key={q.id} href={`/predictions/${q.id}`}>
                  <div className="group rounded-2xl border border-white/8 bg-gradient-to-b from-white/4 to-transparent hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all duration-200 p-4 cursor-pointer h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[10px] bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">Live</span>
                      <span className="text-gray-600 text-[10px] text-right">
                        {q._count.bets} bets · <span className="text-gray-500 font-semibold">₹{total.toLocaleString('en-IN')}</span>
                      </span>
                    </div>

                    <p className="text-white font-black text-sm mb-4 leading-snug group-hover:text-purple-300 transition-colors flex-1">
                      {q.question}
                    </p>

                    {/* Option bars */}
                    <div className="space-y-1.5 mb-3">
                      <div className="relative h-9 rounded-xl overflow-hidden bg-white/5">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-700/70 to-green-600/50 transition-all duration-700 rounded-xl" style={{ width: `${pctA}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span className="text-white text-xs font-bold truncate pr-2">{q.optionA}</span>
                          <span className="text-white text-xs font-black shrink-0">{pctA}%</span>
                        </div>
                      </div>
                      <div className="relative h-9 rounded-xl overflow-hidden bg-white/5">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700/70 to-red-600/50 transition-all duration-700 rounded-xl" style={{ width: `${pctB}%` }} />
                        <div className="absolute inset-0 flex items-center justify-between px-3">
                          <span className="text-white text-xs font-bold truncate pr-2">{q.optionB}</span>
                          <span className="text-white text-xs font-black shrink-0">{pctB}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex gap-3 text-[10px] text-gray-600">
                        <span>A: ₹{poolA.toLocaleString('en-IN')}</span>
                        <span>B: ₹{poolB.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-purple-400 text-xs font-bold group-hover:translate-x-0.5 transition-transform">Bet →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Resolved markets */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-base font-black text-gray-500 mb-3">Resolved</h2>
          <div className="space-y-2">
            {resolved.map(q => {
              const { total } = calcOdds(q.bets)
              return (
                <Link key={q.id} href={`/predictions/${q.id}`}>
                  <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-400 text-sm font-semibold truncate">{q.question}</div>
                      <div className="text-xs mt-0.5">
                        <span className="text-gray-600">Result: </span>
                        <span className={`font-bold ${q.winningOption === 'A' ? 'text-green-400' : 'text-red-400'}`}>
                          {q.winningOption === 'A' ? q.optionA : q.optionB}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-gray-500 text-xs">Pool</div>
                      <div className="text-gold-500 font-bold text-sm">₹{total.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {questions.length === 0 && (
        <div className="rounded-2xl border border-white/8 p-14 text-center">
          <div className="text-4xl mb-3">🔮</div>
          <div className="text-gray-400 font-bold">No prediction markets yet</div>
          <div className="text-gray-600 text-sm mt-1">Check back soon!</div>
        </div>
      )}
    </div>
  )
}
