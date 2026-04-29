import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const lotteries = await prisma.lottery.findMany({
    where: { status: { in: ['ACTIVE', 'SCRATCH_OPEN', 'COMPLETED'] } },
    include: {
      prizeTiers: { orderBy: { rank: 'asc' } },
      _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(lotteries)
}
