import { prisma } from './db'

function generateTicketNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function triggerDraw(lotteryId: string) {
  const lottery = await prisma.lottery.findUnique({
    where: { id: lotteryId },
    include: { prizeTiers: { orderBy: { rank: 'asc' } }, tickets: true },
  })
  if (!lottery) throw new Error('Lottery not found')
  if (lottery.status !== 'ACTIVE') throw new Error('Lottery is not active')

  const approved = lottery.tickets.filter((t) => t.utrStatus === 'APPROVED')
  if (approved.length === 0) throw new Error('No approved tickets')

  const totalPool = approved.length * lottery.ticketPrice
  const prizePool = totalPool * (lottery.poolPercent / 100)
  const winnerCount = Math.max(1, Math.floor(approved.length * (lottery.winPercent / 100)))

  // Sum of all configured per-winner amounts across tiers (used as weight denominator)
  // This lets us distribute the actual prize pool proportionally regardless of fill level
  const configuredTotal = lottery.prizeTiers.reduce((s, t) => s + t.amount * t.winnerCount, 0)

  const shuffled = shuffle(approved)
  const winners = shuffled.slice(0, winnerCount)
  const losers = shuffled.slice(winnerCount)

  const winningNumbers: {
    lotteryId: string; number: string; prizeAmount: number; tierName: string; rank: number; ticketId: string
  }[] = []

  let winnerIdx = 0
  let distributedAmount = 0

  for (const tier of lottery.prizeTiers) {
    // Scale each tier's per-winner amount so that ALL tiers together sum to actual prizePool
    const tierPerWinner = configuredTotal > 0
      ? Math.floor((tier.amount / configuredTotal) * prizePool)
      : Math.floor(prizePool / Math.max(winnerCount, 1))

    const count = Math.min(tier.winnerCount, winnerCount - winnerIdx)
    for (let i = 0; i < count; i++) {
      if (winnerIdx >= winners.length) break
      const ticket = winners[winnerIdx]
      const num = generateTicketNumber()
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { ticketNumber: num, isWinner: true, prizeAmount: tierPerWinner, tierName: tier.tierName },
      })
      winningNumbers.push({
        lotteryId,
        number: num,
        prizeAmount: tierPerWinner,
        tierName: tier.tierName,
        rank: tier.rank,
        ticketId: ticket.id,
      })
      distributedAmount += tierPerWinner
      winnerIdx++
    }
  }

  // Any winners beyond configured tiers share the remaining prize pool as consolation
  if (winnerIdx < winners.length) {
    const remainingPool = Math.max(0, Math.floor(prizePool - distributedAmount))
    const consolationCount = winners.length - winnerIdx
    const consolationPerWinner = consolationCount > 0 ? Math.floor(remainingPool / consolationCount) : 0

    while (winnerIdx < winners.length) {
      const ticket = winners[winnerIdx]
      const num = generateTicketNumber()
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { ticketNumber: num, isWinner: true, prizeAmount: consolationPerWinner, tierName: 'Consolation' },
      })
      winningNumbers.push({ lotteryId, number: num, prizeAmount: consolationPerWinner, tierName: 'Consolation', rank: 99, ticketId: ticket.id })
      winnerIdx++
    }
  }

  // Losers get ticket numbers too (not in winningNumbers)
  for (const ticket of losers) {
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { ticketNumber: generateTicketNumber(), isWinner: false, prizeAmount: 0 },
    })
  }

  await prisma.winningNumber.createMany({ data: winningNumbers })

  const now = new Date()
  const scratchOpenAt = new Date(now.getTime() + lottery.scratchDelay * 60 * 1000)

  await prisma.lottery.update({
    where: { id: lotteryId },
    data: { status: 'SCRATCH_OPEN', triggeredAt: now, scratchOpenAt },
  })

  return { winnerCount, totalPool, prizePool }
}
