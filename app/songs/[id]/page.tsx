import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Song } from '@/lib/types'

async function incrementViews(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.rpc('increment_song_views', { song_id: id })
}

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase.from('songs').select('*').eq('id', id).single()
  if (!data) notFound()

  const song = data as Song
  incrementViews(id)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-56 h-56 rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl">
          {song.thumbnail_url ? (
            <Image
              src={song.thumbnail_url}
              alt={song.title}
              fill
              className="object-cover"
              sizes="224px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-20 h-20 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
              </svg>
            </div>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{song.title}</h1>
          {song.artist && <p className="text-zinc-400 mt-1">{song.artist}</p>}
          {song.genre && (
            <span className="inline-block mt-2 text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">
              {song.genre}
            </span>
          )}
        </div>

        <div className="w-full bg-zinc-900 rounded-xl p-4">
          <audio
            src={song.audio_url}
            controls
            className="w-full"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>

        {song.description && (
          <p className="text-zinc-400 text-sm text-center leading-relaxed">{song.description}</p>
        )}
      </div>
    </div>
  )
}
