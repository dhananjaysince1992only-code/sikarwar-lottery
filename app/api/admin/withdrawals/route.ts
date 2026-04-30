import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(withdrawals)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action, paymentRef } = await req.json()

  if (action === 'pay') {
    await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'PAID', paymentRef: paymentRef ?? '', paidAt: new Date() },
    })
  } else {
    const wr = await prisma.withdrawalRequest.findUnique({ where: { id } })
    if (!wr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const user = await prisma.user.findUnique({ where: { id: wr.userId }, select: { balance: true } })
    await prisma.$transaction([
      prisma.withdrawalRequest.update({ where: { id }, data: { status: 'REJECTED' } }),
      prisma.user.update({ where: { id: wr.userId }, data: { balance: { increment: wr.amount } } }),
      prisma.transaction.create({
        data: {
          userId: wr.userId,
          type: 'refund',
          amount: wr.amount,
          balanceAfter: (user?.balance ?? 0) + wr.amount,
          description: 'Withdrawal rejected — refunded',
        },
      }),
    ])
  }
  return NextResponse.json({ ok: true })
}
