import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@sikarwar.com' } })
  if (existing) return NextResponse.json({ message: 'Already seeded', email: 'admin@sikarwar.com' })

  const hashed = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@sikarwar.com', password: hashed, isAdmin: true },
  })

  const settings = [
    { key: 'site_name', value: 'Sikarwar Lottery' },
    { key: 'default_win_percent', value: '20' },
    { key: 'default_pool_percent', value: '70' },
    { key: 'upi_id', value: '' },
    { key: 'qr_image', value: '' },
    { key: 'announcement', value: 'Welcome to Sikarwar Lottery! Your luck starts here.' },
  ]
  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s })
  }

  return NextResponse.json({ ok: true, message: 'Admin created', email: 'admin@sikarwar.com', password: 'admin123' })
}
