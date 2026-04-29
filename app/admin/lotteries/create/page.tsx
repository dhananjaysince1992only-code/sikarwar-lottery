'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PrizeTier {
  tierName: string
  winnerCount: number
  amount: number
  rank: number
}

export default function CreateLottery() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    ticketPrice: '',
    maxParticipants: '',
    winPercent: '20',
    poolPercent: '70',
    scratchDelay: '0',
    upiId: '',
    qrImage: '',
  })

  const [tiers, setTiers] = useState<PrizeTier[]>([
    { tierName: '1st Prize', winnerCount: 1, amount: 0, rank: 1 },
    { tierName: '2nd Prize', winnerCount: 3, amount: 0, rank: 2 },
    { tierName: '3rd Prize', winnerCount: 10, amount: 0, rank: 3 },
  ])

  const addTier = () => {
    setTiers(t => [...t, { tierName: `Prize ${t.length + 1}`, winnerCount: 5, amount: 0, rank: t.length + 1 }])
  }

  const removeTier = (i: number) => setTiers(t => t.filter((_, idx) => idx !== i))
  const updateTier = (i: number, field: keyof PrizeTier, value: string | number) => {
    setTiers(t => t.map((tier, idx) => idx === i ? { ...tier, [field]: value } : tier))
  }

  const totalPool = parseFloat(form.ticketPrice || '0') * parseInt(form.maxParticipants || '0') * (parseFloat(form.poolPercent) / 100)
  const totalAllocated = tiers.reduce((sum, t) => sum + t.amount * t.winnerCount, 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/lotteries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, prizeTiers: tiers }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/admin/lotteries')
  }

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, qrImage: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-white mb-6">Create New Lottery</h1>

      <form onSubmit={submit} className="space-y-6">
        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

        {/* Basic Info */}
        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Basic Info</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Lottery Name *</label>
            <input required className="input-dark" placeholder="e.g. Diwali Mega Lottery" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Description</label>
            <input className="input-dark" placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Ticket Price (₹) *</label>
              <input required type="number" min="1" className="input-dark" placeholder="100" value={form.ticketPrice} onChange={e => setForm(f => ({ ...f, ticketPrice: e.target.value }))} />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Max Participants *</label>
              <input required type="number" min="2" className="input-dark" placeholder="500" value={form.maxParticipants} onChange={e => setForm(f => ({ ...f, maxParticipants: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Distribution Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Win % (who wins)</label>
              <input type="number" min="1" max="100" className="input-dark" value={form.winPercent} onChange={e => setForm(f => ({ ...f, winPercent: e.target.value }))} />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Prize Pool % (distributed)</label>
              <input type="number" min="1" max="100" className="input-dark" value={form.poolPercent} onChange={e => setForm(f => ({ ...f, poolPercent: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Scratch Delay After Draw (minutes)</label>
            <input type="number" min="0" className="input-dark" value={form.scratchDelay} onChange={e => setForm(f => ({ ...f, scratchDelay: e.target.value }))} />
            <div className="text-gray-700 text-xs mt-1">0 = scratch opens immediately after draw</div>
          </div>
          {form.ticketPrice && form.maxParticipants && (
            <div className="bg-casino-950 rounded-xl p-3 space-y-1 text-sm">
              <div className="flex justify-between text-gray-500"><span>Total collection (if full)</span><span>₹{(parseFloat(form.ticketPrice) * parseInt(form.maxParticipants)).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-green-400"><span>Prize pool ({form.poolPercent}%)</span><span>₹{totalPool.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-gray-500"><span>Your profit (if full)</span><span>₹{(parseFloat(form.ticketPrice) * parseInt(form.maxParticipants) * (1 - parseFloat(form.poolPercent) / 100)).toLocaleString('en-IN')}</span></div>
            </div>
          )}
        </div>

        {/* Prize Tiers */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-gold-400 font-bold">Prize Tiers</h3>
            <button type="button" onClick={addTier} className="text-xs text-purple-400 hover:text-purple-300 font-bold">+ Add Tier</button>
          </div>
          {tiers.map((tier, i) => (
            <div key={i} className="bg-casino-950 rounded-xl p-3 flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-gray-600 text-xs mb-1 block">Tier Name</label>
                <input className="input-dark text-sm py-2" value={tier.tierName} onChange={e => updateTier(i, 'tierName', e.target.value)} />
              </div>
              <div className="w-20">
                <label className="text-gray-600 text-xs mb-1 block">Winners</label>
                <input type="number" min="1" className="input-dark text-sm py-2" value={tier.winnerCount} onChange={e => updateTier(i, 'winnerCount', parseInt(e.target.value))} />
              </div>
              <div className="w-28">
                <label className="text-gray-600 text-xs mb-1 block">Amount (₹)</label>
                <input type="number" min="0" className="input-dark text-sm py-2" value={tier.amount} onChange={e => updateTier(i, 'amount', parseFloat(e.target.value))} />
              </div>
              {tiers.length > 1 && (
                <button type="button" onClick={() => removeTier(i)} className="text-red-500 hover:text-red-400 pb-2 text-lg">×</button>
              )}
            </div>
          ))}
          <div className="text-xs text-gray-600 flex justify-between pt-1">
            <span>Total allocated: ₹{totalAllocated.toLocaleString('en-IN')}</span>
            {totalPool > 0 && <span className={totalAllocated > totalPool ? 'text-red-400' : 'text-green-400'}>Pool: ₹{totalPool.toLocaleString('en-IN')}</span>}
          </div>
        </div>

        {/* Payment settings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Payment Details</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">UPI ID</label>
            <input className="input-dark" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">QR Code Image</label>
            <input type="file" accept="image/*" className="text-gray-400 text-sm" onChange={handleQrUpload} />
            {form.qrImage && <img src={form.qrImage} alt="QR preview" className="w-32 h-32 object-contain bg-white rounded-xl mt-2 p-1" />}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl text-base font-black disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Lottery 🎰'}
        </button>
      </form>
    </div>
  )
}
