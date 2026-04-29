'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Question {
  id: string; question: string; optionA: string; optionB: string
  status: string; winningOption: string; commission: number; createdAt: string
  bets: { option: string; amount: number; utrStatus: string }[]
  _count: { bets: number }
}

export default function AdminPredictions() {
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    fetch('/api/admin/predictions').then(r => r.json()).then(setQuestions)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Prediction Markets</h1>
        <Link href="/admin/predictions/create" className="btn-gold px-5 py-2.5 text-sm rounded-xl">+ Create Question</Link>
      </div>

      <div className="space-y-3">
        {questions.map(q => {
          const approved = q.bets.filter(b => b.utrStatus === 'APPROVED')
          const poolA = approved.filter(b => b.option === 'A').reduce((s, b) => s + b.amount, 0)
          const poolB = approved.filter(b => b.option === 'B').reduce((s, b) => s + b.amount, 0)
          const total = poolA + poolB

          return (
            <Link key={q.id} href={`/admin/predictions/${q.id}`}>
              <div className="card p-5 hover:border-purple-700/50 transition-all flex items-center gap-4 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold truncate">{q.question}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${q.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                      {q.status}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs">
                    {q.optionA} vs {q.optionB} · {q.commission}% house · {approved.length} bettors
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-gold-400 font-black">₹{total.toLocaleString('en-IN')}</div>
                  <div className="text-gray-700 text-xs">total pool</div>
                </div>
              </div>
            </Link>
          )
        })}
        {questions.length === 0 && (
          <div className="card p-10 text-center text-gray-600">No prediction markets yet.</div>
        )}
      </div>
    </div>
  )
}
