import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'
import { notFound } from 'next/navigation'
import type { Show, Episode } from '@/lib/types'

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: showData } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .single()

  if (!showData) notFound()

  const show = showData as Show

  const { data: episodesData } = await supabase
    .from('episodes')
    .select('*')
    .eq('show_id', id)
    .order('season', { ascending: true })
    .order('episode', { ascending: true })

  const episodes = (episodesData ?? []) as Episode[]

  // Group by season
  const seasons = episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = []
    acc[ep.season].push(ep)
    return acc
  }, {})

  const firstEpisode = episodes[0]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {firstEpisode && (
        <VideoPlayer src={firstEpisode.video_url} poster={show.thumbnail_url ?? undefined} />
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

        {show.description && (
          <p className="text-zinc-300 mt-3 leading-relaxed">{show.description}</p>
        )}
      </div>

      {/* Episodes list by season */}
      <div className="mt-10 space-y-8">
        {Object.entries(seasons).map(([season, eps]) => (
          <div key={season}>
            <h2 className="text-lg font-semibold text-white mb-3">Season {season}</h2>
            <div className="space-y-2">
              {eps.map((ep) => (
                <a
                  key={ep.id}
                  href={`/shows/${id}/episode/${ep.id}`}
                  className="flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-4 py-3 transition-colors group"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 group-hover:bg-red-600 flex items-center justify-center transition-colors">
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
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
