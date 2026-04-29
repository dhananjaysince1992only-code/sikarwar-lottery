import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const { option, amount, utrNumber } = await req.json()

  if (!['A', 'B'].includes(option)) return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
  if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  if (!utrNumber?.trim()) return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const question = await prisma.question.findUnique({ where: { id: params.id } })
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  if (question.status !== 'OPEN') return NextResponse.json({ error: 'Betting is closed' }, { status: 400 })

  const existing = await prisma.questionBet.findFirst({
    where: { questionId: params.id, userId: session.id, utrStatus: { not: 'REJECTED' } },
  })
  if (existing) return NextResponse.json({ error: 'You already placed a bet on this question' }, { status: 400 })

  const bet = await prisma.questionBet.create({
    data: {
      questionId: params.id,
      userId: session.id,
      option,
      amount: parseFloat(amount),
      utrNumber: utrNumber.trim(),
    },
  })

  return NextResponse.json({ ok: true, betId: bet.id })
}
