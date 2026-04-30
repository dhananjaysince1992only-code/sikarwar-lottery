import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { upiId } = await req.json()
  if (!upiId?.trim()) return NextResponse.json({ error: 'UPI ID required' }, { status: 400 })

  const bet = await prisma.colorBet.findFirst({
    where: { roundId: params.id, userId: session.id },
  })
  if (!bet) return NextResponse.json({ error: 'No bet found' }, { status: 404 })
  if (!bet.payout) return NextResponse.json({ error: 'No payout available' }, { status: 400 })
  if (bet.payoutStatus !== 'UNPAID') return NextResponse.json({ error: 'Already claimed' }, { status: 400 })

  await prisma.colorBet.update({
    where: { id: bet.id },
    data: { payoutStatus: 'CLAIMED', claimUpiId: upiId.trim() },
  })

  return NextResponse.json({ ok: true })
}
