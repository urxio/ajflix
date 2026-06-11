import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Episode, Show } from '@/lib/types'

export default async function EpisodePage({ params }: { params: Promise<{ id: string; epId: string }> }) {
  const { id, epId } = await params
  const supabase = await createClient()

  const [{ data: epData }, { data: showData }] = await Promise.all([
    supabase.from('episodes').select('*').eq('id', epId).single(),
    supabase.from('shows').select('*').eq('id', id).single(),
  ])

  await supabase.rpc('increment_episode_views', { episode_id: epId })

  if (!epData || !showData) notFound()

  const episode = epData as Episode
  const show = showData as Show

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VideoPlayer src={episode.video_url} poster={episode.thumbnail_url ?? show.thumbnail_url ?? undefined} />

      <div className="mt-6">
        <Link href={`/shows/${id}`} className="text-zinc-400 hover:text-white text-sm transition-colors">
          ← {show.title}
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">
          S{episode.season} E{episode.episode} — {episode.title}
        </h1>
        {episode.description && (
          <p className="text-zinc-300 mt-3 leading-relaxed">{episode.description}</p>
        )}
      </div>
    </div>
  )
}
