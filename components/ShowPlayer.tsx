'use client'

import { useState } from 'react'
import LikeDislike from '@/components/LikeDislike'
import type { Show, Episode } from '@/lib/types'

export default function ShowPlayer({
  show,
  episodes,
}: {
  show: Show
  episodes: Episode[]
}) {
  const [current, setCurrent] = useState<Episode | null>(episodes[0] ?? null)

  const seasons = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = []
    acc[ep.season].push(ep)
    return acc
  }, {})

  return (
    <>
      {current && (
        <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
          <video
            key={current.id}
            src={current.video_url}
            poster={current.thumbnail_url ?? show.thumbnail_url ?? undefined}
            controls
            autoPlay
            className="w-full aspect-video"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{show.title}</h1>
          {show.genre && (
            <span className="shrink-0 text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              {show.genre}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <LikeDislike showId={show.id} initialLikes={show.likes ?? 0} initialDislikes={show.dislikes ?? 0} />
        </div>

        {show.description && (
          <p className="text-zinc-300 mt-3 leading-relaxed">{show.description}</p>
        )}
      </div>

      <div className="mt-10 space-y-8">
        {Object.entries(seasons).map(([season, eps]) => (
          <div key={season}>
            <h2 className="text-lg font-semibold text-white mb-3">Season {season}</h2>
            <div className="space-y-2">
              {eps.map((ep) => {
                const isActive = current?.id === ep.id
                return (
                  <button
                    key={ep.id}
                    onClick={() => setCurrent(ep)}
                    className={`w-full flex items-center gap-4 border rounded-lg px-4 py-3 transition-colors group text-left ${
                      isActive
                        ? 'bg-zinc-800 border-red-600'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        isActive ? 'bg-red-600' : 'bg-zinc-800 group-hover:bg-red-600'
                      }`}
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        E{ep.episode} — {ep.title}
                      </p>
                      {ep.description && (
                        <p className="text-zinc-500 text-xs truncate mt-0.5">{ep.description}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
