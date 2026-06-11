'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Song } from '@/lib/types'

export default function AdminSongList({ songs }: { songs: Song[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(song: Song) {
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return
    setDeleting(song.id)
    await fetch(`/api/songs/${song.id}`, { method: 'DELETE' })
    setDeleting(null)
    router.refresh()
  }

  if (songs.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        <p>No songs yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
        >
          <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0 overflow-hidden">
            {song.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={song.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{song.title}</p>
            <p className="text-zinc-500 text-xs">
              {song.artist && `${song.artist} · `}
              {song.genre && `${song.genre} · `}
              {song.views.toLocaleString()} views ·{' '}
              {new Date(song.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href={`/songs/${song.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              View
            </a>
            <a
              href={`/admin/songs/${song.id}/edit`}
              className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              Edit
            </a>
            <button
              onClick={() => handleDelete(song)}
              disabled={deleting === song.id}
              className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {deleting === song.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
