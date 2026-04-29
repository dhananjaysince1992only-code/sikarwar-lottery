import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const lottery = await prisma.lottery.findUnique({
    where: { id: params.id },
    include: {
      prizeTiers: { orderBy: { rank: 'asc' } },
      winningNumbers: { orderBy: { rank: 'asc' } },
      tickets: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!lottery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(lottery)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const lottery = await prisma.lottery.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      ticketPrice: body.ticketPrice !== undefined ? parseFloat(body.ticketPrice) : undefined,
      maxParticipants: body.maxParticipants !== undefined ? parseInt(body.maxParticipants) : undefined,
      winPercent: body.winPercent !== undefined ? parseFloat(body.winPercent) : undefined,
      poolPercent: body.poolPercent !== undefined ? parseFloat(body.poolPercent) : undefined,
      scratchDelay: body.scratchDelay !== undefined ? parseInt(body.scratchDelay) : undefined,
      upiId: body.upiId,
      qrImage: body.qrImage,
    },
  })
  return NextResponse.json(lottery)
}
