import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { isBanned: true } })
  if (user?.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const { color, amount, utrNumber } = await req.json()

  if (!['red', 'green', 'violet'].includes(color))
    return NextResponse.json({ error: 'Invalid color' }, { status: 400 })
  if (!amount || parseFloat(amount) <= 0)
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!utrNumber?.trim())
    return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const round = await prisma.colorRound.findUnique({ where: { id: params.id } })
  if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 })
  if (round.status !== 'OPEN') return NextResponse.json({ error: 'Round is closed' }, { status: 400 })

  const existing = await prisma.colorBet.findFirst({
    where: { roundId: params.id, userId: session.id, utrStatus: { not: 'REJECTED' } },
  })
  if (existing) return NextResponse.json({ error: 'You already placed a bet on this round' }, { status: 400 })

  const bet = await prisma.colorBet.create({
    data: {
      roundId: params.id,
      userId: session.id,
      color,
      amount: parseFloat(amount),
      utrNumber: utrNumber.trim(),
    },
  })

  return NextResponse.json({ ok: true, betId: bet.id })
}
