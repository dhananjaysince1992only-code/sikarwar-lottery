'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Round {
  id: string; title: string; status: string; result: string; createdAt: string; resolvedAt: string | null
  _count: { bets: number }
  bets: { color: string; amount: number }[]
}

export default function AdminColorGame() {
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    fetch('/api/admin/color-game').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setRounds(data)
    })
  }, [])

  const COLOR_DOT: Record<string, string> = { red: 'bg-red-500', green: 'bg-green-500', violet: 'bg-violet-500' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Color Game</h1>
        <Link href="/admin/color-game/create" className="btn-gold px-5 py-2.5 text-sm rounded-xl">+ Create Round</Link>
      </div>

      <div className="space-y-3">
        {rounds.map(r => {
          const approved = r.bets
          const poolRed = approved.filter(b => b.color === 'red').reduce((s, b) => s + b.amount, 0)
          const poolGreen = approved.filter(b => b.color === 'green').reduce((s, b) => s + b.amount, 0)
          const poolViolet = approved.filter(b => b.color === 'violet').reduce((s, b) => s + b.amount, 0)
          const total = poolRed + poolGreen + poolViolet

          return (
            <Link key={r.id} href={`/admin/color-game/${r.id}`}>
              <div className="card p-5 hover:border-violet-700/50 transition-all flex items-center gap-4 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold truncate">{r.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${r.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                      {r.status}
                    </span>
                    {r.result && (
                      <span className={`w-4 h-4 rounded-full shrink-0 ${COLOR_DOT[r.result] ?? 'bg-gray-500'}`} />
                    )}
                  </div>
                  <div className="text-gray-600 text-xs">
                    {r._count.bets} total bets · ₹{poolRed.toLocaleString('en-IN')} Red / ₹{poolGreen.toLocaleString('en-IN')} Green / ₹{poolViolet.toLocaleString('en-IN')} Violet
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
        {rounds.length === 0 && (
          <div className="card p-10 text-center text-gray-600">No color game rounds yet.</div>
        )}
      </div>
    </div>
  )
}
