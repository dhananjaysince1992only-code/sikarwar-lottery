import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const questions = await prisma.question.findMany({
    include: {
      bets: {
        where: { utrStatus: 'APPROVED' },
        select: { option: true, amount: true },
      },
      _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(questions)
}
