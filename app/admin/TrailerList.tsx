'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Trailer } from '@/lib/types'

export default function AdminTrailerList({ trailers }: { trailers: Trailer[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(trailer: Trailer) {
    if (!confirm(`Delete "${trailer.title}"? This cannot be undone.`)) return
    setDeleting(trailer.id)
    await fetch(`/api/trailers/${trailer.id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  if (trailers.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No trailers yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trailers.map((trailer) => (
        <div
          key={trailer.id}
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
        >
          <div className="w-16 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
            {trailer.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trailer.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-medium truncate">{trailer.title}</p>
              <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">TRAILER</span>
            </div>
            <p className="text-zinc-500 text-xs">
              {trailer.genre && `${trailer.genre} · `}
              {trailer.views.toLocaleString()} views ·{' '}
              {new Date(trailer.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href={`/trailers/${trailer.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              View
            </a>
            <button
              onClick={() => handleDelete(trailer)}
              disabled={deleting === trailer.id}
              className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {deleting === trailer.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
