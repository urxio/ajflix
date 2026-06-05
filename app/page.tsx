import { createClient } from '@/lib/supabase/server'
import VideoCard from '@/components/VideoCard'
import ShowCard from '@/components/ShowCard'
import TrailerCard from '@/components/TrailerCard'
import SongCard from '@/components/SongCard'
import type { Video, Show, Trailer, Song } from '@/lib/types'

export default async function Home() {
  const supabase = await createClient()

  const [
    { data: videosData },
    { data: showsData },
    { data: trailersData },
    { data: songsData },
  ] = await Promise.all([
    supabase.from('videos').select('*').order('created_at', { ascending: false }),
    supabase.from('shows').select('*').order('created_at', { ascending: false }),
    supabase.from('trailers').select('*').order('created_at', { ascending: false }),
    supabase.from('songs').select('*').order('created_at', { ascending: false }),
  ])

  const videos = (videosData ?? []) as Video[]
  const shows = (showsData ?? []) as Show[]
  const trailers = (trailersData ?? []) as Trailer[]
  const songs = (songsData ?? []) as Song[]
  const hasContent = videos.length > 0 || shows.length > 0 || trailers.length > 0 || songs.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {!hasContent && (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <p className="text-lg">No content yet. Check back soon.</p>
        </div>
      )}

      {shows.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Series</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Movies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {trailers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Trailers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {trailers.map((trailer) => (
              <TrailerCard key={trailer.id} trailer={trailer} />
            ))}
          </div>
        </section>
      )}

      {songs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
