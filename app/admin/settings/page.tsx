'use client'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    site_name: '',
    default_win_percent: '20',
    default_pool_percent: '70',
    upi_id: '',
    qr_image: '',
    announcement: '',
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => setSettings(s => ({ ...s, ...d })))
  }, [])

  const handleQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setSettings(s => ({ ...s, qr_image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-black text-white mb-6">Site Settings</h1>

      <form onSubmit={save} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">General</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Site Name</label>
            <input className="input-dark" value={settings.site_name} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Announcement Banner</label>
            <input className="input-dark" placeholder="Shown on homepage" value={settings.announcement} onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Default Distribution</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Default Win %</label>
              <input type="number" min="1" max="100" className="input-dark" value={settings.default_win_percent} onChange={e => setSettings(s => ({ ...s, default_win_percent: e.target.value }))} />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Default Prize Pool %</label>
              <input type="number" min="1" max="100" className="input-dark" value={settings.default_pool_percent} onChange={e => setSettings(s => ({ ...s, default_pool_percent: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="text-gold-400 font-bold">Global Payment Details</h3>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Global UPI ID</label>
            <input className="input-dark" placeholder="yourname@upi" value={settings.upi_id} onChange={e => setSettings(s => ({ ...s, upi_id: e.target.value }))} />
            <div className="text-gray-700 text-xs mt-1">Used if lottery doesn't have its own UPI</div>
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Global QR Code</label>
            <input type="file" accept="image/*" className="text-gray-400 text-sm" onChange={handleQr} />
            {settings.qr_image && (
              <div className="mt-2">
                <img src={settings.qr_image} alt="QR" className="w-32 h-32 object-contain bg-white rounded-xl p-1" />
                <button type="button" onClick={() => setSettings(s => ({ ...s, qr_image: '' }))} className="text-red-400 text-xs mt-1 hover:underline">Remove</button>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full py-3 rounded-xl font-black">
          {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
