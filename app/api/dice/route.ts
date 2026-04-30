import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const HOUSE_EDGE = 0.05  // 5% — RTP 95%

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, prediction, threshold } = await req.json()
  const bet = parseFloat(amount)
  const t = parseInt(threshold)

  if (!bet || bet < 1) return NextResponse.json({ error: 'Minimum bet is ₹1' }, { status: 400 })
  if (!['over', 'under'].includes(prediction)) return NextResponse.json({ error: 'Invalid prediction' }, { status: 400 })
  if (!t || t < 2 || t > 98) return NextResponse.json({ error: 'Threshold must be 2–98' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { balance: true, isBanned: true } })
  if (user?.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  if ((user?.balance ?? 0) < bet) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  // Win probability & multiplier
  const winChance = prediction === 'over' ? (100 - t) / 100 : t / 100
  const multiplier = Math.floor(((1 - HOUSE_EDGE) / winChance) * 100) / 100

  // Roll
  const result = Math.floor(Math.random() * 101)  // 0–100
  const won = prediction === 'over' ? result > t : result < t
  const payout = won ? Math.round(bet * multiplier * 100) / 100 : 0
  const balanceDelta = won ? payout - bet : -bet
  const newBalance = (user?.balance ?? 0) + balanceDelta

  await prisma.$transaction([
    prisma.user.update({ where: { id: session.id }, data: { balance: { increment: balanceDelta } } }),
    prisma.diceGame.create({
      data: { userId: session.id, betAmount: bet, prediction, threshold: t, result, multiplier, payout: won ? payout : null, won },
    }),
    prisma.transaction.create({
      data: {
        userId: session.id,
        type: won ? 'game_win' : 'game_loss',
        amount: won ? payout : bet,
        balanceAfter: newBalance,
        description: `Dice: ${prediction} ${t} → rolled ${result} → ${won ? 'WIN' : 'LOSE'}`,
      },
    }),
  ])

  return NextResponse.json({ ok: true, result, won, payout, multiplier, newBalance })
}
