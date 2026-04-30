import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { utrNumber, payFromWallet } = await req.json()

  const lottery = await prisma.lottery.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tickets: { where: { utrStatus: 'APPROVED' } } } } },
  })
  if (!lottery) return NextResponse.json({ error: 'Lottery not found' }, { status: 404 })
  if (lottery.status !== 'ACTIVE') return NextResponse.json({ error: 'Lottery is not accepting entries' }, { status: 400 })
  if (lottery._count.tickets >= lottery.maxParticipants) return NextResponse.json({ error: 'Lottery is full' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { balance: true, isBanned: true },
  })
  if (user?.isBanned) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  // --- Wallet payment ---
  if (payFromWallet) {
    const balance = user?.balance ?? 0
    if (balance < lottery.ticketPrice) {
      return NextResponse.json({ error: `Insufficient balance. You need ₹${lottery.ticketPrice}, you have ₹${balance.toFixed(2)}` }, { status: 400 })
    }
    const newBalance = balance - lottery.ticketPrice

    const [ticket] = await prisma.$transaction([
      prisma.ticket.create({
        data: {
          lotteryId: params.id,
          userId: session.id,
          utrNumber: 'WALLET',
          utrStatus: 'APPROVED',
        },
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { balance: { decrement: lottery.ticketPrice } },
      }),
      prisma.transaction.create({
        data: {
          userId: session.id,
          type: 'game_loss',
          amount: lottery.ticketPrice,
          balanceAfter: newBalance,
          description: `Lottery ticket: ${lottery.name}`,
        },
      }),
    ])

    return NextResponse.json({ ok: true, ticketId: ticket.id, fromWallet: true })
  }

  // --- UTR payment ---
  if (!utrNumber?.trim()) return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const ticket = await prisma.ticket.create({
    data: { lotteryId: params.id, userId: session.id, utrNumber: utrNumber.trim() },
  })

  return NextResponse.json({ ok: true, ticketId: ticket.id, fromWallet: false })
}
