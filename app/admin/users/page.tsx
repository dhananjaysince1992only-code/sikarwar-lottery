'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string; name: string; email: string; isAdmin: boolean; isBanned: boolean
  createdAt: string
  _count: { tickets: number; questionBets: number; colorBets: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    if (Array.isArray(data)) setUsers(data)
  }

  useEffect(() => { load() }, [])

  const toggleBan = async (id: string, banned: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBanned: !banned }),
    })
    load()
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Users ({users.length})</h1>
        <input
          className="input-dark text-sm py-2 w-56"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th title="Approved lottery tickets">🎰 Lottery</th>
                <th title="Approved prediction bets">🔮 Predict</th>
                <th title="Approved color bets">🎨 Color</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/users/${u.id}`} className="text-white font-medium hover:text-purple-300 transition-colors">
                        {u.name}
                      </Link>
                      {u.isAdmin && <span className="text-xs text-purple-400 font-bold">ADMIN</span>}
                    </div>
                  </td>
                  <td className="text-gray-500 text-xs">{u.email}</td>
                  <td className="text-center">
                    <span className={u._count.tickets > 0 ? 'text-purple-300 font-bold' : 'text-gray-700'}>
                      {u._count.tickets}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={u._count.questionBets > 0 ? 'text-blue-300 font-bold' : 'text-gray-700'}>
                      {u._count.questionBets}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={u._count.colorBets > 0 ? 'text-violet-300 font-bold' : 'text-gray-700'}>
                      {u._count.colorBets}
                    </span>
                  </td>
                  <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBanned ? 'badge-rejected' : 'badge-approved'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/admin/users/${u.id}`} className="text-xs text-gray-500 hover:text-purple-300 transition-colors">
                        View →
                      </Link>
                      {!u.isAdmin && (
                        <button
                          onClick={() => toggleBan(u.id, u.isBanned)}
                          className={`text-xs font-bold hover:underline ${u.isBanned ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
