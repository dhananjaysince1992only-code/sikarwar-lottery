import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@sikarwar.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@sikarwar.com',
      password: hashed,
      isAdmin: true,
    },
  })

  const settings = [
    { key: 'site_name', value: 'Sikarwar Lottery' },
    { key: 'default_win_percent', value: '20' },
    { key: 'default_pool_percent', value: '70' },
    { key: 'upi_id', value: 'sikarwar@upi' },
    { key: 'qr_image', value: '' },
    { key: 'announcement', value: 'Welcome to Sikarwar Lottery! Your luck starts here.' },
  ]

  for (const s of settings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: {}, create: s })
  }

  console.log('Seeded: admin@sikarwar.com / admin123')
}

main().finally(() => prisma.$disconnect())
