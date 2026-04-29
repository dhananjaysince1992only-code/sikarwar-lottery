'use client'
import { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  ticketId: string
  onScratched: (result: { ticketNumber: string; isWinner: boolean; prizeAmount: number; tierName: string }) => void
}

export default function ScratchCard({ ticketId, onScratched }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ticketNumber: string; isWinner: boolean; prizeAmount: number; tierName: string } | null>(null)
  const [scratchPercent, setScratchPercent] = useState(0)
  const hasCalledApi = useRef(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, '#B8860B')
    grad.addColorStop(0.3, '#FFD700')
    grad.addColorStop(0.5, '#FFF8DC')
    grad.addColorStop(0.7, '#FFD700')
    grad.addColorStop(1, '#B8860B')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    for (let i = 0; i < 60; i++) {
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.font = 'bold 18px serif'
    ctx.fillStyle = '#8B6914'
    ctx.textAlign = 'center'
    ctx.fillText('✦ SCRATCH HERE ✦', w / 2, h / 2 - 10)
    ctx.font = '13px serif'
    ctx.fillText('Sikarwar Lottery', w / 2, h / 2 + 14)
  }, [])

  useEffect(() => { initCanvas() }, [initCanvas])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || revealed) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getPos(e, canvas)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 28, 0, Math.PI * 2)
    ctx.fill()

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparent = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++
    }
    const pct = (transparent / (pixels.length / 4)) * 100
    setScratchPercent(pct)

    if (pct > 55 && !hasCalledApi.current) {
      hasCalledApi.current = true
      revealResult(canvas, ctx)
    }
  }

  const revealResult = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${ticketId}/scratch`, { method: 'POST' })
      const data = await res.json()
      if (data.error) { alert(data.error); return }
      setResult(data)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setRevealed(true)
      onScratched(data)
    } catch {
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative select-none">
      {/* Card background shown beneath canvas */}
      <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-casino-900 border border-gold-500/30">
        {result ? (
          result.isWinner ? (
            <div className="text-center px-4">
              <div className="text-5xl mb-2">🎉</div>
              <div className="text-gold-400 font-black text-2xl animate-glow">{result.tierName}</div>
              <div className="text-white font-black text-4xl mt-1">₹{result.prizeAmount.toLocaleString('en-IN')}</div>
              <div className="text-gray-400 text-sm mt-2">Your Number</div>
              <div className="text-white font-mono text-3xl font-black tracking-[0.3em] mt-1">{result.ticketNumber}</div>
            </div>
          ) : (
            <div className="text-center px-4">
              <div className="text-4xl mb-2">😔</div>
              <div className="text-gray-400 font-bold text-lg">Better Luck Next Time</div>
              <div className="text-gray-500 text-sm mt-1">Your Number</div>
              <div className="text-white font-mono text-3xl font-black tracking-[0.3em] mt-1">{result.ticketNumber}</div>
              <div className="text-gray-600 text-xs mt-3">Check winners board to compare</div>
            </div>
          )
        ) : (
          <div className="text-gray-700 text-sm font-bold">Scratch to reveal</div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={200}
        className={`relative z-10 rounded-2xl cursor-pointer touch-none w-full ${revealed ? 'opacity-0 pointer-events-none' : ''}`}
        style={{ transition: revealed ? 'opacity 0.5s' : '' }}
        onMouseDown={() => setIsScratching(true)}
        onMouseUp={() => setIsScratching(false)}
        onMouseLeave={() => setIsScratching(false)}
        onMouseMove={scratch}
        onTouchStart={() => setIsScratching(true)}
        onTouchEnd={() => setIsScratching(false)}
        onTouchMove={scratch}
      />

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-casino-900/80 rounded-2xl">
          <div className="text-gold-400 text-sm animate-pulse">Revealing...</div>
        </div>
      )}

      {!revealed && scratchPercent < 55 && (
        <div className="mt-2 text-center text-xs text-gray-600">
          Keep scratching... {Math.round(scratchPercent)}%
        </div>
      )}
    </div>
  )
}
