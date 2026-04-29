import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const tickets = await prisma.ticket.findMany({
    where: { isWinner: true, payoutStatus: 'CLAIMED' },
    include: {
      user: { select: { name: true, email: true } },
      lottery: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tickets)
}
