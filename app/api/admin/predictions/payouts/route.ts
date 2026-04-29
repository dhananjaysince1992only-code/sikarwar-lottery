import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bets = await prisma.questionBet.findMany({
    where: { payoutStatus: 'CLAIMED' },
    include: {
      user: { select: { name: true, email: true } },
      question: { select: { question: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(bets)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { betId, paymentRef } = await req.json()
  await prisma.questionBet.update({
    where: { id: betId },
    data: { payoutStatus: 'PAID', paidAt: new Date(), paymentRef: paymentRef ?? '' },
  })
  return NextResponse.json({ ok: true })
}
