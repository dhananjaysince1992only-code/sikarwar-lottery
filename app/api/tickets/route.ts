import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.id },
    include: { lottery: { select: { id: true, name: true, status: true, scratchOpenAt: true, ticketPrice: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(tickets)
}
