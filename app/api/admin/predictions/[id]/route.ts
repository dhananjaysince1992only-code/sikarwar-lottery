import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      bets: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(question)
}
