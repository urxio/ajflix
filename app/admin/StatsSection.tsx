'use client'

import { useState } from 'react'
import type { Video, Trailer, Song, Show, Episode } from '@/lib/types'

type ShowWithEpisodes = Show & { episodes: Episode[] }

interface Props {
  videos: Video[]
  trailers: Trailer[]
  songs: Song[]
  shows: ShowWithEpisodes[]
}

export default function StatsSection({ videos, trailers, songs, shows }: Props) {
  const [expandedShow, setExpandedShow] = useState<string | null>(null)

  const totalVideoViews = videos.reduce((sum, v) => sum + v.views, 0)
  const totalTrailerViews = trailers.reduce((sum, t) => sum + t.views, 0)
  const totalSongViews = songs.reduce((sum, s) => sum + s.views, 0)
  const totalShowViews = shows.reduce(
    (sum, s) => sum + s.episodes.reduce((eSum, e) => eSum + (e.views ?? 0), 0),
    0
  )
  const grandTotal = totalVideoViews + totalTrailerViews + totalSongViews + totalShowViews

  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Statistics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Views" value={grandTotal} highlight />
        <StatCard label="Movie Views" value={totalVideoViews} />
        <StatCard label="Show Views" value={totalShowViews} />
        <StatCard label="Trailer Views" value={totalTrailerViews} />
        <StatCard label="Song Views" value={totalSongViews} />
      </div>

      {/* Shows breakdown */}
      {shows.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Views per episode</p>
          <div className="space-y-2">
            {shows.map((show) => {
              const showTotal = show.episodes.reduce((sum, e) => sum + (e.views ?? 0), 0)
              const isOpen = expandedShow === show.id
              const bySeasonEpisode = [...show.episodes].sort((a, b) =>
                a.season !== b.season ? a.season - b.season : a.episode - b.episode
              )

              return (
                <div key={show.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedShow(isOpen ? null : show.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-white font-medium truncate">{show.title}</span>
                      <span className="text-zinc-500 text-xs shrink-0">
                        {show.episodes.length} ep{show.episodes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-zinc-300 text-sm font-medium">
                        {showTotal.toLocaleString()} views
                      </span>
                      <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-zinc-800">
                      {bySeasonEpisode.length === 0 ? (
                        <p className="text-zinc-600 text-sm px-4 py-3">No episodes.</p>
                      ) : (
                        <div className="divide-y divide-zinc-800/60">
                          {bySeasonEpisode.map((ep) => (
                            <div key={ep.id} className="flex items-center justify-between px-4 py-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-zinc-500 text-xs font-mono shrink-0 w-14">
                                  S{String(ep.season).padStart(2, '0')}E{String(ep.episode).padStart(2, '0')}
                                </span>
                                <span className="text-zinc-300 text-sm truncate">{ep.title}</span>
                              </div>
                              <span className="text-zinc-400 text-sm shrink-0 ml-4">
                                {(ep.views ?? 0).toLocaleString()} views
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg px-4 py-3 border ${highlight ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-900 border-zinc-800'}`}>
      <p className="text-zinc-500 text-xs mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-zinc-200'}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}
