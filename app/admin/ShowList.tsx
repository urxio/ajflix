'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Show } from '@/lib/types'

export default function AdminShowList({ shows }: { shows: Show[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(show: Show) {
    if (!confirm(`Delete "${show.title}" and all its episodes? This cannot be undone.`)) return
    setDeleting(show.id)

    await fetch(`/api/shows/${show.id}`, { method: 'DELETE' })

    setDeleting(null)
    router.refresh()
  }

  if (shows.length === 0) {
    return <p className="text-zinc-600 text-sm py-4">No shows yet.</p>
  }

  return (
    <div className="space-y-3">
      {shows.map((show) => (
        <div
          key={show.id}
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
        >
          <div className="w-16 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
            {show.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={show.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{show.title}</p>
            <p className="text-zinc-500 text-xs">
              {show.genre && `${show.genre} · `}
              {new Date(show.created_at).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => handleDelete(show)}
            disabled={deleting === show.id}
            className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50 shrink-0"
          >
            {deleting === show.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  )
}
