import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function AdminUserDetail({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.isAdmin) redirect('/admin')

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      tickets: {
        include: { lottery: { select: { name: true, ticketPrice: true } } },
        orderBy: { createdAt: 'desc' },
      },
      questionBets: {
        include: { question: { select: { question: true, optionA: true, optionB: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) notFound()

  const totalSpent =
    user.tickets.filter(t => t.utrStatus === 'APPROVED').reduce((s, t) => s + (t.lottery.ticketPrice ?? 0), 0) +
    user.questionBets.filter(b => b.utrStatus === 'APPROVED').reduce((s, b) => s + b.amount, 0)

  const totalWon =
    user.tickets.filter(t => t.isWinner).reduce((s, t) => s + (t.prizeAmount ?? 0), 0) +
    user.questionBets.filter(b => b.payout).reduce((s, b) => s + (b.payout ?? 0), 0)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-gray-600 hover:text-gray-400 text-sm">← Users</Link>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white mb-1">{user.name}</h1>
            <div className="text-gray-500 text-sm">{user.email}</div>
            <div className="text-gray-700 text-xs mt-1">Joined {new Date(user.createdAt).toLocaleDateString('en-IN')}</div>
          </div>
          <div className="flex gap-2">
            {user.isAdmin && <span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full font-bold">ADMIN</span>}
            <span className={`text-xs px-3 py-1 rounded-full font-bold ${user.isBanned ? 'badge-rejected' : 'badge-approved'}`}>
              {user.isBanned ? 'Banned' : 'Active'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-red-400' },
            { label: 'Total Won', value: `₹${totalWon.toLocaleString('en-IN')}`, color: 'text-green-400' },
            { label: 'Net P&L', value: `₹${(totalWon - totalSpent).toLocaleString('en-IN')}`, color: totalWon >= totalSpent ? 'text-green-400' : 'text-red-400' },
            { label: 'Games Played', value: String(user.tickets.length + user.questionBets.length), color: 'text-gold-400' },
          ].map(s => (
            <div key={s.label} className="bg-casino-950 rounded-xl p-3 text-center">
              <div className={`font-black text-lg ${s.color}`}>{s.value}</div>
              <div className="text-gray-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {user.tickets.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-900 flex items-center gap-2">
            <span className="text-xl">🎰</span>
            <h3 className="text-gold-400 font-bold">Lottery Tickets ({user.tickets.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>Lottery</th><th>Ticket #</th><th>UTR</th><th>Status</th><th>Winner</th><th>Prize</th><th>Date</th></tr></thead>
              <tbody>
                {user.tickets.map(t => (
                  <tr key={t.id}>
                    <td className="text-purple-300">{t.lottery.name}</td>
                    <td><span className="font-mono text-xs">{t.ticketNumber || '—'}</span></td>
                    <td><span className="font-mono text-xs text-yellow-300">{t.utrNumber}</span></td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full ${t.utrStatus === 'APPROVED' ? 'badge-approved' : t.utrStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{t.utrStatus}</span></td>
                    <td>{t.isWinner === true ? <span className="text-green-400 font-bold">✓ Won</span> : t.isWinner === false ? <span className="text-gray-600 text-xs">Lost</span> : <span className="text-gray-700 text-xs">—</span>}</td>
                    <td className="text-gold-400 font-bold">{t.prizeAmount ? `₹${t.prizeAmount.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="text-gray-600 text-xs">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.questionBets.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-900 flex items-center gap-2">
            <span className="text-xl">🔮</span>
            <h3 className="text-gold-400 font-bold">Prediction Bets ({user.questionBets.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead><tr><th>Question</th><th>Pick</th><th>Amount</th><th>UTR</th><th>Status</th><th>Payout</th><th>Date</th></tr></thead>
              <tbody>
                {user.questionBets.map(b => (
                  <tr key={b.id}>
                    <td className="max-w-xs"><span className="text-blue-300 text-sm line-clamp-1">{b.question.question}</span></td>
                    <td><span className={`font-bold text-sm ${b.option === 'A' ? 'text-green-400' : 'text-red-400'}`}>{b.option === 'A' ? b.question.optionA : b.question.optionB}</span></td>
                    <td className="font-bold">₹{b.amount.toLocaleString('en-IN')}</td>
                    <td><span className="font-mono text-xs text-yellow-300">{b.utrNumber}</span></td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full ${b.utrStatus === 'APPROVED' ? 'badge-approved' : b.utrStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>{b.utrStatus}</span></td>
                    <td className="text-gold-400 font-bold">{b.payout ? `₹${b.payout.toLocaleString('en-IN')}` : '—'}</td>
                    <td className="text-gray-600 text-xs">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.tickets.length === 0 && user.questionBets.length === 0 && (
        <div className="card p-10 text-center text-gray-600">No game activity yet.</div>
      )}
    </div>
  )
}
