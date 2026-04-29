import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const lottery = await prisma.lottery.findUnique({
    where: { id: params.id },
    include: {
      prizeTiers: { orderBy: { rank: 'asc' } },
      winningNumbers: { orderBy: { rank: 'asc' } },
      _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } },
    },
  })
  if (!lottery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lottery)
}
