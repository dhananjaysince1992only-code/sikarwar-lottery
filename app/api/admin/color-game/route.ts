import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rounds = await prisma.colorRound.findMany({
    include: {
      _count: { select: { bets: true } },
      bets: {
        where: { utrStatus: 'APPROVED' },
        select: { color: true, amount: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(rounds)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, upiId, qrImage } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const round = await prisma.colorRound.create({
    data: { title: title.trim(), upiId: upiId ?? '', qrImage: qrImage ?? '' },
  })
  return NextResponse.json(round)
}
