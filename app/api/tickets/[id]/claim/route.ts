import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { upiId } = await req.json()
  if (!upiId?.trim()) return NextResponse.json({ error: 'UPI ID required' }, { status: 400 })

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (!ticket || ticket.userId !== session.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ticket.isWinner) return NextResponse.json({ error: 'Not a winning ticket' }, { status: 400 })
  if (!ticket.scratchedAt) return NextResponse.json({ error: 'Scratch first' }, { status: 400 })

  await prisma.ticket.update({
    where: { id: params.id },
    data: { claimUpiId: upiId.trim(), payoutStatus: 'CLAIMED' },
  })

  return NextResponse.json({ ok: true })
}
