'use client'
import { useEffect, useState } from 'react'

interface WinningNumber {
  id: string
  number: string
  prizeAmount: number
  tierName: string
  rank: number
  winnerName: string
}

export default function WinnersBoard({ lotteryId }: { lotteryId: string }) {
  const [winners, setWinners] = useState<WinningNumber[]>([])

  useEffect(() => {
    const fetchWinners = async () => {
      const res = await fetch(`/api/lotteries/${lotteryId}`)
      const data = await res.json()
      setWinners(data.winningNumbers ?? [])
    }
    fetchWinners()
    const interval = setInterval(fetchWinners, 8000)
    return () => clearInterval(interval)
  }, [lotteryId])

  const revealed = winners.filter(w => w.winnerName)
  const unrevealed = winners.filter(w => !w.winnerName)

  return (
    <div className="bg-casino-800 border border-gold-500/20 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold-400 text-lg">🏆</span>
        <h3 className="text-gold-400 font-black text-lg">Winners Board</h3>
        <span className="ml-auto text-xs text-gray-600">{revealed.length}/{winners.length} revealed</span>
      </div>

      {winners.length === 0 && (
        <p className="text-gray-600 text-sm text-center py-4">Draw not triggered yet</p>
      )}

      {/* Revealed winners */}
      {revealed.length > 0 && (
        <div className="space-y-2 mb-4">
          {revealed.sort((a, b) => a.rank - b.rank).map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 animate-pulse-gold">
              <span className="text-green-400 font-mono font-black text-lg tracking-wider">#{w.number}</span>
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{w.winnerName}</div>
                <div className="text-gray-400 text-xs">{w.tierName}</div>
              </div>
              <div className="text-gold-400 font-black">₹{w.prizeAmount.toLocaleString('en-IN')}</div>
            </div>
          ))}
        </div>
      )}

      {/* Unrevealed slots */}
      {unrevealed.length > 0 && (
        <div className="space-y-2">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">
            {unrevealed.length} winner{unrevealed.length > 1 ? 's' : ''} yet to scratch...
          </p>
          {unrevealed.slice(0, 5).map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3">
              <span className="text-gray-700 font-mono font-black text-lg tracking-wider">#{w.number}</span>
              <div className="flex-1">
                <div className="text-gray-700 font-bold text-sm">??? hasn't scratched yet</div>
                <div className="text-gray-800 text-xs">{w.tierName}</div>
              </div>
              <div className="text-gray-700 font-black">₹{w.prizeAmount.toLocaleString('en-IN')}</div>
            </div>
          ))}
          {unrevealed.length > 5 && (
            <p className="text-gray-700 text-xs text-center">+{unrevealed.length - 5} more not scratched</p>
          )}
        </div>
      )}
    </div>
  )
}
