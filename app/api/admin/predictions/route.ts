import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const questions = await prisma.question.findMany({
    include: {
      bets: { select: { option: true, amount: true, utrStatus: true } },
      _count: { select: { bets: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(questions)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { question, description, optionA, optionB, commission, upiId, qrImage } = await req.json()

  const q = await prisma.question.create({
    data: {
      question,
      description: description ?? '',
      optionA,
      optionB,
      commission: parseFloat(commission ?? 5),
      upiId: upiId ?? '',
      qrImage: qrImage ?? '',
    },
  })
  return NextResponse.json(q)
}
