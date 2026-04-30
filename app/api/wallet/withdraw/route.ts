import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, upiId } = await req.json()
  if (!amount || parseFloat(amount) < 10)
    return NextResponse.json({ error: 'Minimum withdrawal is ₹10' }, { status: 400 })
  if (!upiId?.trim())
    return NextResponse.json({ error: 'UPI ID required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { balance: true } })
  if ((user?.balance ?? 0) < parseFloat(amount))
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.id },
      data: { balance: { decrement: parseFloat(amount) } },
    }),
    prisma.withdrawalRequest.create({
      data: { userId: session.id, amount: parseFloat(amount), upiId: upiId.trim() },
    }),
    prisma.transaction.create({
      data: {
        userId: session.id,
        type: 'withdraw',
        amount: parseFloat(amount),
        balanceAfter: (user?.balance ?? 0) - parseFloat(amount),
        description: `Withdrawal to ${upiId}`,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
