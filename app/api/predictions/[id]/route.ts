import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const q = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      bets: {
        where: { utrStatus: 'APPROVED' },
        select: { option: true, amount: true, userId: true },
      },
    },
  })
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(q)
}
