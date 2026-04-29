import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { upiId } = await req.json()
  if (!upiId?.trim()) return NextResponse.json({ error: 'UPI ID required' }, { status: 400 })

  const bet = await prisma.questionBet.findFirst({
    where: { questionId: params.id, userId: session.id, utrStatus: 'APPROVED' },
    include: { question: true },
  })
  if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
  if (bet.question.status !== 'RESOLVED') return NextResponse.json({ error: 'Not resolved yet' }, { status: 400 })
  if (bet.option !== bet.question.winningOption) return NextResponse.json({ error: 'Not a winning bet' }, { status: 400 })
  if (bet.payoutStatus !== 'UNPAID') return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

  await prisma.questionBet.update({
    where: { id: bet.id },
    data: { claimUpiId: upiId.trim(), payoutStatus: 'CLAIMED' },
  })

  return NextResponse.json({ ok: true })
}
