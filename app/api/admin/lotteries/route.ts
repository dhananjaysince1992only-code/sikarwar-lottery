import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const lotteries = await prisma.lottery.findMany({
    include: {
      prizeTiers: { orderBy: { rank: 'asc' } },
      _count: { select: { tickets: true, winningNumbers: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(lotteries)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, description, ticketPrice, maxParticipants, winPercent, poolPercent, scratchDelay, upiId, qrImage, prizeTiers } = body

  const lottery = await prisma.lottery.create({
    data: {
      name,
      description: description ?? '',
      ticketPrice: parseFloat(ticketPrice),
      maxParticipants: parseInt(maxParticipants),
      winPercent: parseFloat(winPercent ?? 20),
      poolPercent: parseFloat(poolPercent ?? 70),
      scratchDelay: parseInt(scratchDelay ?? 0),
      upiId: upiId ?? '',
      qrImage: qrImage ?? '',
      prizeTiers: {
        create: (prizeTiers ?? []).map((t: { tierName: string; winnerCount: number; amount: number; rank: number }) => ({
          tierName: t.tierName,
          winnerCount: parseInt(String(t.winnerCount)),
          amount: parseFloat(String(t.amount)),
          rank: parseInt(String(t.rank)),
        })),
      },
    },
    include: { prizeTiers: true },
  })

  return NextResponse.json(lottery)
}
