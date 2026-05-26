'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Video } from '@/lib/types'

export default function AdminVideoList({ videos }: { videos: Video[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(video: Video) {
    if (!confirm(`Delete "${video.title}"? This cannot be undone.`)) return
    setDeleting(video.id)

    await fetch(`/api/videos/${video.id}`, { method: 'DELETE' })

    setDeleting(null)
    router.refresh()
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p>No videos yet. Upload your first one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
        >
          <div className="w-16 h-10 rounded bg-zinc-800 shrink-0 overflow-hidden">
            {video.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{video.title}</p>
            <p className="text-zinc-500 text-xs">
              {video.genre && `${video.genre} · `}
              {video.views.toLocaleString()} views ·{' '}
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href={`/watch/${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              View
            </a>
            <a
              href={`/admin/videos/${video.id}/edit`}
              className="text-zinc-400 hover:text-white text-xs border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
            >
              Edit
            </a>
            <button
              onClick={() => handleDelete(video)}
              disabled={deleting === video.id}
              className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            >
              {deleting === video.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
