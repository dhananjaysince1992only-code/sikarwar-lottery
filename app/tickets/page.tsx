import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function TicketsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const tickets = await prisma.ticket.findMany({
    where: { userId: session.id },
    include: {
      lottery: { select: { id: true, name: true, status: true, scratchOpenAt: true, ticketPrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pending = tickets.filter(t => t.utrStatus === 'PENDING')
  const active = tickets.filter(t => t.utrStatus === 'APPROVED' && t.lottery.status === 'ACTIVE')
  const scratchNow = tickets.filter(t => t.utrStatus === 'APPROVED' && t.lottery.status === 'SCRATCH_OPEN' && !t.scratchedAt)
  const scratched = tickets.filter(t => t.scratchedAt)
  const rejected = tickets.filter(t => t.utrStatus === 'REJECTED')

  const statusBadge = (t: typeof tickets[0]) => {
    if (t.utrStatus === 'PENDING') return <span className="badge-pending text-xs px-2 py-0.5 rounded-full">Pending Verification</span>
    if (t.utrStatus === 'REJECTED') return <span className="badge-rejected text-xs px-2 py-0.5 rounded-full">Rejected</span>
    if (t.lottery.status === 'ACTIVE') return <span className="badge-approved text-xs px-2 py-0.5 rounded-full">Ticket Active</span>
    if (t.lottery.status === 'SCRATCH_OPEN' && !t.scratchedAt) return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">Scratch Now!</span>
    if (t.scratchedAt && t.isWinner) return <span className="badge-approved text-xs px-2 py-0.5 rounded-full">Won ₹{t.prizeAmount?.toLocaleString('en-IN')}</span>
    if (t.scratchedAt && !t.isWinner) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">Better Luck Next Time</span>
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-white mb-2">My Tickets</h1>
      <p className="text-gray-500 mb-8">Track all your lottery entries</p>

      {/* Scratch now alert */}
      {scratchNow.length > 0 && (
        <div className="mb-6 bg-gold-500/10 border border-gold-500/40 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-4xl animate-float">🎰</div>
          <div className="flex-1">
            <div className="text-gold-400 font-black text-lg">You have {scratchNow.length} card{scratchNow.length > 1 ? 's' : ''} to scratch!</div>
            <div className="text-gray-400 text-sm">Don't wait — scratch now and see if you won!</div>
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎟️</div>
          <div className="text-gray-400 text-lg font-bold">No tickets yet</div>
          <div className="text-gray-600 text-sm mt-2 mb-6">Join a lottery to get your first ticket!</div>
          <Link href="/" className="btn-gold px-6 py-2.5 rounded-xl text-sm font-black inline-block">Browse Lotteries</Link>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map(ticket => {
          const canScratch = ticket.utrStatus === 'APPROVED' && ticket.lottery.status === 'SCRATCH_OPEN' && !ticket.scratchedAt
          const scratchReady = canScratch && (!ticket.lottery.scratchOpenAt || new Date() >= ticket.lottery.scratchOpenAt)

          return (
            <div key={ticket.id} className={`card p-5 flex items-center gap-4 ${canScratch ? 'border-gold-500/40 bg-gold-500/5' : ''}`}>
              <div className="text-3xl">{canScratch ? '🎰' : ticket.isWinner ? '🏆' : '🎟️'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-bold truncate">{ticket.lottery.name}</span>
                  {statusBadge(ticket)}
                </div>
                <div className="text-gray-600 text-xs mt-0.5">
                  UTR: <span className="font-mono text-gray-500">{ticket.utrNumber}</span>
                  {ticket.utrStatus === 'REJECTED' && ticket.utrRejectionReason && (
                    <span className="text-red-500 ml-2">— {ticket.utrRejectionReason}</span>
                  )}
                </div>
                {ticket.scratchedAt && (
                  <div className="text-gray-700 text-xs mt-0.5">
                    Your number: <span className="font-mono text-gray-500 font-bold">{ticket.ticketNumber}</span>
                  </div>
                )}
                {ticket.isWinner && ticket.payoutStatus === 'UNPAID' && ticket.scratchedAt && (
                  <Link href={`/scratch/${ticket.id}`} className="text-gold-400 text-xs font-bold hover:underline">→ Claim your prize</Link>
                )}
                {ticket.payoutStatus === 'CLAIMED' && <div className="text-yellow-600 text-xs">Payout pending admin approval</div>}
                {ticket.payoutStatus === 'PAID' && <div className="text-green-500 text-xs">✓ Paid to {ticket.claimUpiId}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-gray-600 text-xs">₹{ticket.lottery.ticketPrice}</div>
                {scratchReady && (
                  <Link href={`/scratch/${ticket.id}`} className="btn-gold px-4 py-2 rounded-lg text-xs font-black inline-block mt-2">
                    SCRATCH NOW
                  </Link>
                )}
                {canScratch && !scratchReady && (
                  <div className="text-yellow-600 text-xs mt-1">Opens soon</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
