import { prisma } from '@/lib/db'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminLotteries() {
  const lotteries = await prisma.lottery.findMany({
    include: {
      _count: { select: { tickets: true } },
      prizeTiers: { orderBy: { rank: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">All Lotteries</h1>
        <Link href="/admin/lotteries/create" className="btn-gold px-5 py-2.5 text-sm rounded-xl">+ Create Lottery</Link>
      </div>

      <div className="card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Participants</th>
              <th>Top Prize</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {lotteries.map(l => (
              <tr key={l.id}>
                <td className="text-white font-medium">{l.name}</td>
                <td>₹{l.ticketPrice}</td>
                <td>{l._count.tickets}/{l.maxParticipants}</td>
                <td className="text-gold-400">₹{(l.prizeTiers[0]?.amount ?? 0).toLocaleString('en-IN')}</td>
                <td>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    l.status === 'ACTIVE' ? 'bg-purple-500/20 text-purple-300' :
                    l.status === 'SCRATCH_OPEN' ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-700 text-gray-500'
                  }`}>{l.status}</span>
                </td>
                <td>
                  <Link href={`/admin/lotteries/${l.id}`} className="text-purple-400 hover:text-purple-300 text-sm font-medium">Manage →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lotteries.length === 0 && (
          <div className="text-center py-12 text-gray-600">No lotteries yet. Create one!</div>
        )}
      </div>
    </div>
  )
}
