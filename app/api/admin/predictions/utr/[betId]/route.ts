import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { betId: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, reason } = await req.json()

  await prisma.questionBet.update({
    where: { id: params.betId },
    data: {
      utrStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
      utrRejectionReason: action === 'reject' ? (reason ?? 'Payment not found') : '',
    },
  })

  return NextResponse.json({ ok: true })
}
