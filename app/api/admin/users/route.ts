import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, isAdmin: true, isBanned: true, createdAt: true,
      _count: {
        select: {
          tickets: { where: { utrStatus: 'APPROVED' } },
          questionBets: { where: { utrStatus: 'APPROVED' } },
          colorBets: { where: { utrStatus: 'APPROVED' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(users)
}
