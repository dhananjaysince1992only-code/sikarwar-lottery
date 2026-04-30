import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

type RoundWithBets = Prisma.CrashRoundGetPayload<{
  include: { bets: { include: { user: { select: { name: true } } } } }
}>

const GROWTH = 0.00006      // multiplier = e^(GROWTH * elapsed_ms)
const WAIT_MS = 10_000      // 10s betting window

function calcMultiplier(startedAt: Date): number {
  return Math.exp(GROWTH * (Date.now() - startedAt.getTime()))
}

function newCrashPoint(): number {
  const houseEdge = 0.05
  const r = Math.random()
  if (r < houseEdge) return 1.00
  return Math.max(1.01, Math.floor(((1 - houseEdge) / r) * 100) / 100)
}

export async function GET() {
  let round = await prisma.crashRound.findFirst({
    where: { status: { in: ['WAITING', 'IN_PROGRESS'] } },
    include: {
      bets: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const now = Date.now()

  // Create new round if none active
  if (!round) {
    const newRound = await prisma.crashRound.create({
      data: { crashPoint: newCrashPoint() },
      include: { bets: { include: { user: { select: { name: true } } } } },
    })
    return NextResponse.json(formatRound(newRound, now))
  }

  // Advance WAITING → IN_PROGRESS
  if (round.status === 'WAITING' && now - round.createdAt.getTime() >= WAIT_MS) {
    try {
      const updated = await prisma.crashRound.update({
        where: { id: round.id, status: 'WAITING' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
        include: { bets: { include: { user: { select: { name: true } } } } },
      })
      round = updated
    } catch { /* already updated by another request */ }
  }

  // Advance IN_PROGRESS → CRASHED
  if (round.status === 'IN_PROGRESS' && round.startedAt) {
    const mult = calcMultiplier(round.startedAt)
    if (mult >= round.crashPoint) {
      try {
        await prisma.$transaction([
          prisma.crashRound.update({
            where: { id: round.id, status: 'IN_PROGRESS' },
            data: { status: 'CRASHED', crashedAt: new Date() },
          }),
          prisma.crashBet.updateMany({
            where: { roundId: round.id, status: 'ACTIVE' },
            data: { status: 'LOST' },
          }),
        ])
        const crashed = await prisma.crashRound.findUnique({
          where: { id: round.id },
          include: { bets: { include: { user: { select: { name: true } } } } },
        })
        return NextResponse.json(formatRound(crashed!, now))
      } catch { /* already crashed */ }
    }
  }

  return NextResponse.json(formatRound(round, now))
}

function formatRound(round: RoundWithBets, now: number) {
  return {
    id: round.id,
    status: round.status,
    createdAt: round.createdAt,
    startedAt: round.startedAt,
    crashedAt: round.crashedAt,
    crashPoint: round.status === 'CRASHED' ? round.crashPoint : null,
    bets: round.bets.map(b => ({
      id: b.id,
      userId: b.userId,
      userName: b.user.name,
      betAmount: b.betAmount,
      cashedOutAt: b.cashedOutAt,
      status: b.status,
    })),
  }
}
