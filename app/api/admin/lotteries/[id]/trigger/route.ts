import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { triggerDraw } from '@/lib/lottery-engine'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const result = await triggerDraw(params.id)
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Draw failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
