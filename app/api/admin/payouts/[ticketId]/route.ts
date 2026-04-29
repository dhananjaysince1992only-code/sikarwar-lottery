import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { paymentRef } = await req.json()

  await prisma.ticket.update({
    where: { id: params.ticketId },
    data: { payoutStatus: 'PAID', paidAt: new Date(), paymentRef: paymentRef ?? '' },
  })

  return NextResponse.json({ ok: true })
}
