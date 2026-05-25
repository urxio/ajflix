import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'
import LikeDislike from '@/components/LikeDislike'
import { notFound } from 'next/navigation'
import type { Video } from '@/lib/types'

async function incrementViews(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.rpc('increment_views', { video_id: id })
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const video = data as Video

  // Fire-and-forget view increment
  incrementViews(id)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VideoPlayer src={video.video_url} poster={video.thumbnail_url ?? undefined} />

      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>
          {video.genre && (
            <span className="shrink-0 text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              {video.genre}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-zinc-500 text-sm">{video.views.toLocaleString()} views</p>
          <LikeDislike
            videoId={video.id}
            initialLikes={video.likes ?? 0}
            initialDislikes={video.dislikes ?? 0}
          />
        </div>

        {video.description && (
          <p className="text-zinc-300 mt-4 leading-relaxed">{video.description}</p>
        )}
      </div>

    </div>
  )
}
