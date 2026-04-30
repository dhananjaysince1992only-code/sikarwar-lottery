import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const deposits = await prisma.depositRequest.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { name: true, email: true, balance: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(deposits)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, action, reason } = await req.json()

  const deposit = await prisma.depositRequest.findUnique({ where: { id } })
  if (!deposit || deposit.status !== 'PENDING')
    return NextResponse.json({ error: 'Not found or already processed' }, { status: 400 })

  if (action === 'approve') {
    const user = await prisma.user.findUnique({ where: { id: deposit.userId }, select: { balance: true } })
    const newBalance = (user?.balance ?? 0) + deposit.amount

    await prisma.$transaction([
      prisma.depositRequest.update({ where: { id }, data: { status: 'APPROVED' } }),
      prisma.user.update({ where: { id: deposit.userId }, data: { balance: { increment: deposit.amount } } }),
      prisma.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'deposit',
          amount: deposit.amount,
          balanceAfter: newBalance,
          description: `Deposit via UPI (UTR: ${deposit.utrNumber})`,
        },
      }),
    ])
  } else {
    await prisma.depositRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason ?? 'Payment not found' },
    })
  }

  return NextResponse.json({ ok: true })
}
