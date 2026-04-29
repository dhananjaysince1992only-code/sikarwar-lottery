import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, reason } = await req.json()

  if (action === 'approve') {
    await prisma.ticket.update({
      where: { id: params.ticketId },
      data: { utrStatus: 'APPROVED' },
    })
  } else if (action === 'reject') {
    await prisma.ticket.update({
      where: { id: params.ticketId },
      data: { utrStatus: 'REJECTED', utrRejectionReason: reason ?? 'Payment not found' },
    })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
