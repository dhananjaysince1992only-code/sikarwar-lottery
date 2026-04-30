import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { amount, utrNumber } = await req.json()
  if (!amount || parseFloat(amount) < 10)
    return NextResponse.json({ error: 'Minimum deposit is ₹10' }, { status: 400 })
  if (!utrNumber?.trim())
    return NextResponse.json({ error: 'UTR number required' }, { status: 400 })

  const deposit = await prisma.depositRequest.create({
    data: { userId: session.id, amount: parseFloat(amount), utrNumber: utrNumber.trim() },
  })
  return NextResponse.json({ ok: true, depositId: deposit.id })
}
