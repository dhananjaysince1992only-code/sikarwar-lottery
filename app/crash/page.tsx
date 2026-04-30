import { getSession } from '@/lib/auth'
import CrashClient from './CrashClient'

export const metadata = { title: '🚀 Crash — Sikarwar' }

export default async function CrashPage() {
  const session = await getSession()
  return (
    <div>
      <div className="text-center py-6 px-4">
        <h1 className="text-3xl font-black text-white mb-1">🚀 Crash</h1>
        <p className="text-gray-400 text-sm">Cash out before the crash — win up to 1000×</p>
      </div>
      <CrashClient userId={session?.id ?? null} />
    </div>
  )
}
