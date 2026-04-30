import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount } = await req.json()
  const bet = parseFloat(amount)
  if (!bet || bet < 1) return NextResponse.json({ error: 'Minimum bet is ₹1' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { balance: true, isBanned: true } })
  if (user?.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  if ((user?.balance ?? 0) < bet) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  const round = await prisma.crashRound.findFirst({ where: { status: 'WAITING' } })
  if (!round) return NextResponse.json({ error: 'No betting window open. Wait for next round.' }, { status: 400 })

  const existing = await prisma.crashBet.findFirst({ where: { roundId: round.id, userId: session.id } })
  if (existing) return NextResponse.json({ error: 'Already bet on this round' }, { status: 400 })

  const newBalance = (user?.balance ?? 0) - bet
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.id }, data: { balance: { decrement: bet } } }),
    prisma.crashBet.create({ data: { roundId: round.id, userId: session.id, betAmount: bet } }),
    prisma.transaction.create({
      data: { userId: session.id, type: 'game_loss', amount: bet, balanceAfter: newBalance, description: `Crash bet on round ${round.id.slice(-6)}` },
    }),
  ])

  return NextResponse.json({ ok: true })
}
