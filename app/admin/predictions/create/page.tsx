'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePrediction() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ question: '', description: '', optionA: '', optionB: '', commission: '5', upiId: '', qrImage: '' })
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
    const res = await fetch('/api/admin/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { setError(data.error); return }
    router.push('/admin/predictions')
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-white mb-6">Create Prediction Market</h1>

      <form onSubmit={submit} className="space-y-5">
        {error && <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Question</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Question *</label>
            <input required className="input-dark" placeholder="e.g. Will India win the World Cup 2025?" value={form.question} onChange={f('question')} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Description (optional)</label>
            <input className="input-dark" placeholder="Add context about this question" value={form.description} onChange={f('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Option A (Green) *</label>
              <input required className="input-dark" placeholder="Yes / Team A / Over" value={form.optionA} onChange={f('optionA')} />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Option B (Red) *</label>
              <input required className="input-dark" placeholder="No / Team B / Under" value={form.optionB} onChange={f('optionB')} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Settings</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">House Commission %</label>
            <input type="number" min="0" max="20" step="0.5" className="input-dark" value={form.commission} onChange={f('commission')} />
            <div className="text-gray-700 text-xs mt-1">
              {form.commission}% taken from total pool. Winners split the remaining {100 - parseFloat(form.commission || '5')}%.
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Payment</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">UPI ID</label>
            <input className="input-dark" placeholder="yourname@upi" value={form.upiId} onChange={f('upiId')} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">QR Code</label>
            <input type="file" accept="image/*" className="text-gray-400 text-sm" onChange={handleQr} />
            {form.qrImage && <img src={form.qrImage} alt="QR" className="w-32 h-32 object-contain bg-white rounded-xl mt-2 p-1" />}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl font-black disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Prediction Market 🔮'}
        </button>
      </form>
    </div>
  )
}
