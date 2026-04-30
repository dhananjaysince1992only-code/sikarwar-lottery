import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [user, transactions, deposits, withdrawals] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.id }, select: { balance: true } }),
    prisma.transaction.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.depositRequest.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.withdrawalRequest.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return NextResponse.json({ balance: user?.balance ?? 0, transactions, deposits, withdrawals })
}
