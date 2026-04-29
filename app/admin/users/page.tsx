'use client'
import { useEffect, useState } from 'react'

interface User {
  id: string; name: string; email: string; isAdmin: boolean; isBanned: boolean
  createdAt: string; _count: { tickets: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])

  const load = async () => {
    const res = await fetch('/api/admin/users')
    setUsers(await res.json())
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

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-6">Users ({users.length})</h1>

      <div className="card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr><th>User</th><th>Email</th><th>Tickets</th><th>Joined</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <span className="text-white font-medium">{u.name}</span>
                  {u.isAdmin && <span className="ml-2 text-xs text-purple-400 font-bold">ADMIN</span>}
                </td>
                <td className="text-gray-500 text-xs">{u.email}</td>
                <td>{u._count.tickets}</td>
                <td className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.isBanned ? 'badge-rejected' : 'badge-approved'}`}>
                    {u.isBanned ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td>
                  {!u.isAdmin && (
                    <button
                      onClick={() => toggleBan(u.id, u.isBanned)}
                      className={`text-xs font-bold hover:underline ${u.isBanned ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
