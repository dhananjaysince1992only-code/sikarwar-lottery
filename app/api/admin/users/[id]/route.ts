import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { isBanned } = await req.json()
  await prisma.user.update({ where: { id: params.id }, data: { isBanned } })
  return NextResponse.json({ ok: true })
}
