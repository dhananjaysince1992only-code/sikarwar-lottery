import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const rounds = await prisma.colorRound.findMany({
    include: {
      _count: { select: { bets: { where: { utrStatus: 'APPROVED' } } } },
      bets: {
        where: { utrStatus: 'APPROVED' },
        select: { color: true, amount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return NextResponse.json(rounds)
}
