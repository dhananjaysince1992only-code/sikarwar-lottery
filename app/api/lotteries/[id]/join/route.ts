import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { utrNumber } = await req.json()
  if (!utrNumber?.trim()) return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const lottery = await prisma.lottery.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } } },
  })
  if (!lottery) return NextResponse.json({ error: 'Lottery not found' }, { status: 404 })
  if (lottery.status !== 'ACTIVE') return NextResponse.json({ error: 'Lottery is not accepting entries' }, { status: 400 })
  if (lottery._count.tickets >= lottery.maxParticipants) return NextResponse.json({ error: 'Lottery is full' }, { status: 400 })

  const ticket = await prisma.ticket.create({
    data: { lotteryId: params.id, userId: session.id, utrNumber: utrNumber.trim() },
  })

  return NextResponse.json({ ok: true, ticketId: ticket.id })
}
