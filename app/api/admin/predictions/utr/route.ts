import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const bets = await prisma.questionBet.findMany({
    where: { utrStatus: 'PENDING' },
    include: {
      user: { select: { name: true, email: true } },
      question: { select: { question: true, optionA: true, optionB: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(bets)
}
