import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { option, amount, utrNumber, payFromWallet } = await req.json()
  const betAmount = parseFloat(amount)

  if (!['A', 'B'].includes(option)) return NextResponse.json({ error: 'Invalid option' }, { status: 400 })
  if (!betAmount || betAmount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const question = await prisma.question.findUnique({ where: { id: params.id } })
  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  if (question.status !== 'OPEN') return NextResponse.json({ error: 'Betting is closed' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { balance: true, isBanned: true },
  })
  if (user?.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  // --- Wallet payment ---
  if (payFromWallet) {
    const balance = user?.balance ?? 0
    if (balance < betAmount) {
      return NextResponse.json({ error: `Insufficient balance. You need ₹${betAmount}, you have ₹${balance.toFixed(2)}` }, { status: 400 })
    }
    const newBalance = balance - betAmount

    const [bet] = await prisma.$transaction([
      prisma.questionBet.create({
        data: {
          questionId: params.id,
          userId: session.id,
          option,
          amount: betAmount,
          utrNumber: 'WALLET',
          utrStatus: 'APPROVED',
        },
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { balance: { decrement: betAmount } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.id,
          type: 'game_loss',
          amount: betAmount,
          balanceAfter: newBalance,
          description: `Prediction bet on: ${question.question.slice(0, 60)}`,
        },
      }),
    ])

    return NextResponse.json({ ok: true, betId: bet.id, fromWallet: true })
  }

  // --- UTR payment ---
  if (!utrNumber?.trim()) return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const bet = await prisma.questionBet.create({
    data: {
      questionId: params.id,
      userId: session.id,
      option,
      amount: betAmount,
      utrNumber: utrNumber.trim(),
    },
  })

  return NextResponse.json({ ok: true, betId: bet.id, fromWallet: false })
}
