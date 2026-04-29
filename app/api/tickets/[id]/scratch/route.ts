import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { lottery: true },
  })
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  if (ticket.userId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (ticket.utrStatus !== 'APPROVED') return NextResponse.json({ error: 'Ticket not verified' }, { status: 400 })
  if (ticket.lottery.status !== 'SCRATCH_OPEN') return NextResponse.json({ error: 'Scratch not open yet' }, { status: 400 })

  const scratchOpenAt = ticket.lottery.scratchOpenAt
  if (scratchOpenAt && new Date() < scratchOpenAt) {
    return NextResponse.json({ error: 'Scratch opens soon', opensAt: scratchOpenAt }, { status: 400 })
  }

  if (!ticket.scratchedAt) {
    await prisma.ticket.update({ where: { id: ticket.id }, data: { scratchedAt: new Date() } })

    if (ticket.isWinner) {
      await prisma.winningNumber.updateMany({
        where: { ticketId: ticket.id },
        data: { winnerName: session.name },
      })
    }
  }

  return NextResponse.json({
    ticketNumber: ticket.ticketNumber,
    isWinner: ticket.isWinner,
    prizeAmount: ticket.prizeAmount,
    tierName: ticket.tierName,
  })
}
