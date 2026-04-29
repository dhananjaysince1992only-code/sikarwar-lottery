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
  const scaleFactor = approved.length / lottery.maxParticipants

  const shuffled = shuffle(approved)
  const winners = shuffled.slice(0, winnerCount)
  const losers = shuffled.slice(winnerCount)

  const winningNumbers: {
    lotteryId: string; number: string; prizeAmount: number; tierName: string; rank: number; ticketId: string
  }[] = []

  let winnerIdx = 0
  for (const tier of lottery.prizeTiers) {
    const scaledAmount = Math.floor(tier.amount * scaleFactor)
    const count = Math.min(tier.winnerCount, winnerCount - winnerIdx)
    for (let i = 0; i < count; i++) {
      if (winnerIdx >= winners.length) break
      const ticket = winners[winnerIdx]
      const num = generateTicketNumber()
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { ticketNumber: num, isWinner: true, prizeAmount: scaledAmount, tierName: tier.tierName },
      })
      winningNumbers.push({
        lotteryId,
        number: num,
        prizeAmount: scaledAmount,
        tierName: tier.tierName,
        rank: tier.rank,
        ticketId: ticket.id,
      })
      winnerIdx++
    }
  }

  // Remaining winners beyond configured tiers get proportional consolation
  while (winnerIdx < winners.length) {
    const ticket = winners[winnerIdx]
    const consolation = Math.floor((prizePool * 0.05 * scaleFactor) / Math.max(1, winners.length - winnerIdx))
    const num = generateTicketNumber()
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { ticketNumber: num, isWinner: true, prizeAmount: consolation, tierName: 'Consolation' },
    })
    winningNumbers.push({ lotteryId, number: num, prizeAmount: consolation, tierName: 'Consolation', rank: 99, ticketId: ticket.id })
    winnerIdx++
  }

  // Losers get numbers too (hidden, not in winningNumbers)
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
