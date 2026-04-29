import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { winningOption } = await req.json()
  if (!['A', 'B'].includes(winningOption)) return NextResponse.json({ error: 'Invalid option' }, { status: 400 })

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: { bets: { where: { utrStatus: 'APPROVED' } } },
  })
  if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (question.status !== 'OPEN') return NextResponse.json({ error: 'Already resolved' }, { status: 400 })

  const totalPool = question.bets.reduce((s, b) => s + b.amount, 0)
  const commission = totalPool * (question.commission / 100)
  const prizePool = totalPool - commission

  const winnerBets = question.bets.filter(b => b.option === winningOption)
  const totalWinnerStake = winnerBets.reduce((s, b) => s + b.amount, 0)

  // Calculate each winner's payout proportionally
  for (const bet of winnerBets) {
    const payout = totalWinnerStake > 0 ? (bet.amount / totalWinnerStake) * prizePool : 0
    await prisma.questionBet.update({
      where: { id: bet.id },
      data: { payout: Math.round(payout * 100) / 100 },
    })
  }

  await prisma.question.update({
    where: { id: params.id },
    data: { status: 'RESOLVED', winningOption, resolvedAt: new Date() },
  })

  return NextResponse.json({ ok: true, totalPool, prizePool, commission, winners: winnerBets.length })
}
