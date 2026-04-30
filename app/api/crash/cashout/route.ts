import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const GROWTH = 0.00006

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const round = await prisma.crashRound.findFirst({ where: { status: 'IN_PROGRESS' } })
  if (!round?.startedAt) return NextResponse.json({ error: 'No active round' }, { status: 400 })

  const bet = await prisma.crashBet.findFirst({
    where: { roundId: round.id, userId: session.id, status: 'ACTIVE' },
  })
  if (!bet) return NextResponse.json({ error: 'No active bet found' }, { status: 400 })

  const elapsed = Date.now() - round.startedAt.getTime()
  const currentMult = Math.exp(GROWTH * elapsed)
  const crashElapsed = Math.log(round.crashPoint) / GROWTH

  if (elapsed >= crashElapsed) {
    return NextResponse.json({ error: "Too late — round already crashed!" }, { status: 400 })
  }

  const cashoutMult = Math.floor(currentMult * 100) / 100
  const payout = Math.round(bet.betAmount * cashoutMult * 100) / 100
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { balance: true } })
  const newBalance = (user?.balance ?? 0) + payout

  await prisma.$transaction([
    prisma.crashBet.update({
      where: { id: bet.id },
      data: { status: 'CASHED_OUT', cashedOutAt: cashoutMult, payout },
    }),
    prisma.user.update({ where: { id: session.id }, data: { balance: { increment: payout } } }),
    prisma.transaction.create({
      data: {
        userId: session.id,
        type: 'game_win',
        amount: payout,
        balanceAfter: newBalance,
        description: `Crash cashout at ${cashoutMult}×`,
      },
    }),
  ])

  return NextResponse.json({ ok: true, multiplier: cashoutMult, payout })
}
