'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ScratchCard from '@/components/ScratchCard'
import Link from 'next/link'

interface ScratchResult {
  ticketNumber: string
  isWinner: boolean
  prizeAmount: number
  tierName: string
}

export default function ScratchPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.ticketId as string

  const [result, setResult] = useState<ScratchResult | null>(null)
  const [claimUpi, setClaimUpi] = useState('')
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [confetti, setConfetti] = useState(false)

  const onScratched = (r: ScratchResult) => {
    setResult(r)
    if (r.isWinner) {
      setConfetti(true)
      setTimeout(() => setConfetti(false), 4000)
    }
  }

  const claim = async (e: React.FormEvent) => {
    e.preventDefault()
    setClaiming(true)
    const res = await fetch(`/api/tickets/${ticketId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId: claimUpi }),
    })
    setClaiming(false)
    const data = await res.json()
    if (data.ok) setClaimed(true)
  }

  const confettiPieces = Array.from({ length: 30 })
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {/* Confetti */}
      {confetti && confettiPieces.map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            animationDelay: `${Math.random() * 0.5}s`,
            width: `${6 + Math.random() * 10}px`,
            height: `${6 + Math.random() * 10}px`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white">Scratch Your Card</h1>
          <p className="text-gray-500 text-sm mt-1">Drag to reveal your lottery number</p>
        </div>

        <div className="card p-6">
          <ScratchCard ticketId={ticketId} onScratched={onScratched} />
        </div>

        {/* After scratch */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Go check winners board */}
            <div className="card p-4 text-center">
              <div className="text-gray-400 text-sm">Your number is</div>
              <div className="ticket-number mt-1">{result.ticketNumber}</div>
              <div className="text-gray-500 text-xs mt-2">
                Check the winners board on the lottery page to see if your number won!
              </div>
            </div>

            {result.isWinner && !claimed && (
              <div className="card p-5 border-gold-500/40 bg-gold-500/5">
                <div className="text-center mb-4">
                  <div className="text-gold-400 font-black text-xl">🎉 You Won!</div>
                  <div className="text-white font-black text-3xl">₹{result.prizeAmount.toLocaleString('en-IN')}</div>
                  <div className="text-gray-500 text-sm">{result.tierName}</div>
                </div>
                <form onSubmit={claim} className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">Enter UPI ID to receive prize</label>
                    <input
                      required
                      className="input-dark"
                      placeholder="yourname@upi"
                      value={claimUpi}
                      onChange={e => setClaimUpi(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={claiming} className="btn-gold w-full py-3 rounded-xl font-black">
                    {claiming ? 'Submitting...' : 'Claim My Prize 💰'}
                  </button>
                </form>
              </div>
            )}

            {claimed && (
              <div className="card p-5 border-green-500/30 text-center">
                <div className="text-green-400 font-black text-lg">✅ Claim Submitted!</div>
                <div className="text-gray-400 text-sm mt-2">Admin will transfer your prize to {claimUpi} soon.</div>
              </div>
            )}

            <div className="text-center">
              <Link href="/tickets" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
                ← Back to My Tickets
              </Link>
            </div>
          </div>
        )}

        {!result && (
          <div className="text-center mt-4">
            <Link href="/tickets" className="text-gray-600 text-xs hover:text-gray-400 transition-colors">
              ← Back to tickets
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
