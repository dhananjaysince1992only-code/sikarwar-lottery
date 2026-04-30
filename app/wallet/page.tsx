'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface WalletData {
  balance: number
  transactions: { id: string; type: string; amount: number; balanceAfter: number; description: string; createdAt: string }[]
  deposits: { id: string; amount: number; utrNumber: string; status: string; rejectionReason: string; createdAt: string }[]
  withdrawals: { id: string; amount: number; upiId: string; status: string; createdAt: string }[]
}

const TYPE_CONFIG: Record<string, { label: string; color: string; sign: string }> = {
  deposit:    { label: 'Deposit',  color: 'text-green-400',  sign: '+' },
  withdraw:   { label: 'Withdraw', color: 'text-red-400',    sign: '-' },
  game_win:   { label: 'Win',      color: 'text-gold-400',   sign: '+' },
  game_loss:  { label: 'Loss',     color: 'text-red-400',    sign: '-' },
  refund:     { label: 'Refund',   color: 'text-blue-400',   sign: '+' },
}

export default function WalletPage() {
  const router = useRouter()
  const [data, setData] = useState<WalletData | null>(null)
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [form, setForm] = useState({ amount: '', utrNumber: '', upiId: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const UPI_ID = 'sikarwar@upi'  // Site UPI — set in admin settings ideally

  const load = async () => {
    const res = await fetch('/api/wallet')
    if (res.status === 401) { router.push('/login'); return }
    setData(await res.json())
  }
  useEffect(() => { load() }, [])

  const deposit = async () => {
    setLoading(true); setError(''); setMsg('')
    const res = await fetch('/api/wallet/deposit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: form.amount, utrNumber: form.utrNumber }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    setMsg('Deposit request submitted! Admin will verify and credit within minutes.')
    setForm(f => ({ ...f, amount: '', utrNumber: '' }))
    load()
  }

  const withdraw = async () => {
    setLoading(true); setError(''); setMsg('')
    const res = await fetch('/api/wallet/withdraw', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: form.amount, upiId: form.upiId }),
    })
    const d = await res.json()
    setLoading(false)
    if (d.error) { setError(d.error); return }
    setMsg('Withdrawal requested! Admin will process within 24 hours.')
    setForm(f => ({ ...f, amount: '', upiId: '' }))
    load()
  }

  const presets = [100, 250, 500, 1000, 2000, 5000]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-white mb-6">My Wallet</h1>

      {/* Balance card */}
      <div className="card p-6 mb-6 bg-gradient-to-br from-purple-900/40 to-casino-800 border-purple-700/40">
        <div className="text-gray-400 text-sm mb-1 uppercase tracking-widest">Available Balance</div>
        <div className="text-gold-400 font-black text-5xl">
          ₹{(data?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="flex gap-3 mt-4">
          <a href="/" className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-colors">
            🎰 Lottery
          </a>
          <a href="/predictions" className="text-xs bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-500/30 transition-colors">
            🔮 Predict
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['deposit', 'withdraw', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${tab === t ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-gray-500 hover:text-gray-300'}`}>
            {t === 'deposit' ? '+ Deposit' : t === 'withdraw' ? '− Withdraw' : '📋 History'}
          </button>
        ))}
      </div>

      {msg && <div className="bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-green-400 text-sm mb-4">{msg}</div>}
      {error && <div className="bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">{error}</div>}

      {/* Deposit tab */}
      {tab === 'deposit' && (
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="text-gold-400 font-bold mb-4">Pay via UPI</h3>
            <div className="bg-casino-950 rounded-xl p-4 text-center mb-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Site UPI ID</div>
              <div className="text-white font-bold font-mono text-lg">{UPI_ID}</div>
              <div className="text-gray-600 text-xs mt-1">Transfer your deposit amount to this UPI ID</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">Amount (₹)</label>
                <input type="number" className="input-dark text-lg font-bold" placeholder="Enter amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {presets.map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, amount: String(p) }))}
                      className="text-xs bg-casino-800 border border-gray-700 hover:border-purple-500 text-gray-300 px-3 py-1.5 rounded-lg transition-colors">
                      ₹{p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1.5 block">UTR / Transaction ID</label>
                <input className="input-dark" placeholder="12-digit UTR from your UPI app" value={form.utrNumber} onChange={e => setForm(f => ({ ...f, utrNumber: e.target.value }))} />
              </div>
              <button onClick={deposit} disabled={loading || !form.amount || !form.utrNumber} className="btn-gold w-full py-3.5 rounded-xl font-black disabled:opacity-40">
                {loading ? 'Submitting...' : 'Submit Deposit Request'}
              </button>
            </div>
          </div>

          {/* Pending deposits */}
          {data?.deposits && data.deposits.length > 0 && (
            <div className="card p-4">
              <div className="text-gray-500 text-xs uppercase tracking-widest mb-3">Recent Deposits</div>
              {data.deposits.slice(0, 5).map(d => (
                <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-900 last:border-0">
                  <div>
                    <div className="text-white text-sm font-bold">₹{d.amount.toLocaleString('en-IN')}</div>
                    <div className="text-gray-600 text-xs font-mono">{d.utrNumber}</div>
                    {d.rejectionReason && <div className="text-red-400 text-xs">{d.rejectionReason}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'APPROVED' ? 'badge-approved' : d.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdraw tab */}
      {tab === 'withdraw' && (
        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Withdraw to UPI</h3>
          <div className="bg-casino-950 rounded-xl p-3 text-center">
            <div className="text-gray-500 text-xs">Available</div>
            <div className="text-gold-400 font-black text-2xl">₹{(data?.balance ?? 0).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Amount (₹)</label>
            <input type="number" className="input-dark text-lg font-bold" placeholder="Enter amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Your UPI ID</label>
            <input className="input-dark" placeholder="yourname@upi" value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} />
          </div>
          <button onClick={withdraw} disabled={loading || !form.amount || !form.upiId} className="btn-gold w-full py-3.5 rounded-xl font-black disabled:opacity-40">
            {loading ? 'Processing...' : 'Request Withdrawal'}
          </button>
          <div className="text-gray-700 text-xs text-center">Admin processes withdrawals within 24 hours</div>
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="card overflow-hidden">
          {!data?.transactions?.length ? (
            <div className="p-10 text-center text-gray-600">No transactions yet</div>
          ) : (
            <div>
              {data.transactions.map(t => {
                const cfg = TYPE_CONFIG[t.type] ?? { label: t.type, color: 'text-gray-400', sign: '' }
                const isWin = ['deposit', 'game_win', 'refund'].includes(t.type)
                return (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-900 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${isWin ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isWin ? '+' : '−'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{t.description}</div>
                      <div className="text-gray-700 text-xs">{new Date(t.createdAt).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black ${cfg.color}`}>{cfg.sign}₹{t.amount.toLocaleString('en-IN')}</div>
                      <div className="text-gray-700 text-xs">Bal: ₹{t.balanceAfter.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
