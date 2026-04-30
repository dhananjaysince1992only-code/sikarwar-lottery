import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

const MULTIPLIERS: Record<string, number> = { red: 1.9, green: 1.9, violet: 4.5 }

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const round = await prisma.colorRound.findUnique({
    where: { id: params.id },
    include: {
      bets: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!round) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(round)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, result } = await req.json()

  if (action === 'resolve') {
    if (!['red', 'green', 'violet'].includes(result))
      return NextResponse.json({ error: 'Invalid color result' }, { status: 400 })

    const round = await prisma.colorRound.findUnique({
      where: { id: params.id },
      include: { bets: { where: { utrStatus: 'APPROVED' } } },
    })
    if (!round) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (round.status !== 'OPEN') return NextResponse.json({ error: 'Already resolved' }, { status: 400 })

    const multiplier = MULTIPLIERS[result]
    let winners = 0

    await prisma.$transaction(async (tx) => {
      for (const bet of round.bets) {
        if (bet.color === result) {
          await tx.colorBet.update({
            where: { id: bet.id },
            data: { payout: Math.round(bet.amount * multiplier * 100) / 100 },
          })
          winners++
        }
      }
      await tx.colorRound.update({
        where: { id: params.id },
        data: { status: 'RESOLVED', result, resolvedAt: new Date() },
      })
    })

    return NextResponse.json({ ok: true, winners, multiplier, color: result })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
