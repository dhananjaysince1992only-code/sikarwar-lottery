'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateColorRound() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', upiId: '', qrImage: '' })
  const [error, setError] = useState('')

  const handleQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, qrImage: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/color-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/admin/color-game')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-white mb-2">Create Color Round</h1>
      <p className="text-gray-500 text-sm mb-6">Players pick Red (1.9×), Green (1.9×), or Violet (4.5×). You draw the result.</p>

      <form onSubmit={submit} className="space-y-5">
        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Round Info</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Round Title *</label>
            <input required className="input-dark" placeholder="e.g. Evening Round, Round #12" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Payment Details</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">UPI ID</label>
            <input className="input-dark" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">QR Code Image</label>
            <input type="file" accept="image/*" className="text-gray-400 text-sm" onChange={handleQr} />
            {form.qrImage && <img src={form.qrImage} alt="QR" className="w-32 h-32 object-contain bg-white rounded-xl mt-2 p-1" />}
          </div>
        </div>

        {/* Payout reference */}
        <div className="card p-4 bg-casino-800">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-2">Payout Multipliers (fixed)</div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-2">
              <div className="text-red-400 font-black">🔴 Red</div>
              <div className="text-white font-black">1.9×</div>
            </div>
            <div className="bg-green-900/20 border border-green-500/20 rounded-lg p-2">
              <div className="text-green-400 font-black">🟢 Green</div>
              <div className="text-white font-black">1.9×</div>
            </div>
            <div className="bg-violet-900/20 border border-violet-500/20 rounded-lg p-2">
              <div className="text-violet-400 font-black">🟣 Violet</div>
              <div className="text-gold-400 font-black">4.5×</div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl font-black disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Round 🎰'}
        </button>
      </form>
    </div>
  )
}
