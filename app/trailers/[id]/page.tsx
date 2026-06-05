import { createClient } from '@/lib/supabase/server'
import VideoPlayer from '@/components/VideoPlayer'
import { notFound } from 'next/navigation'
import type { Trailer } from '@/lib/types'

async function incrementViews(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.rpc('increment_trailer_views', { trailer_id: id })
}

export default async function TrailerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase.from('trailers').select('*').eq('id', id).single()
  if (!data) notFound()

  const trailer = data as Trailer
  incrementViews(id)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <VideoPlayer src={trailer.video_url} poster={trailer.thumbnail_url ?? undefined} />

      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Trailer</span>
            <h1 className="text-2xl font-bold text-white mt-1">{trailer.title}</h1>
          </div>
          {trailer.genre && (
            <span className="shrink-0 text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              {trailer.genre}
            </span>
          )}
        </div>

        <p className="text-zinc-500 text-sm mt-2">{trailer.views.toLocaleString()} views</p>

        {trailer.description && (
          <p className="text-zinc-300 mt-4 leading-relaxed">{trailer.description}</p>
        )}
      </div>
    </div>
  )
}
