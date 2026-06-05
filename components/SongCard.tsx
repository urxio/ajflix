import Link from 'next/link'
import Image from 'next/image'
import type { Song } from '@/lib/types'

export default function SongCard({ song }: { song: Song }) {
  return (
    <Link
      href={`/songs/${song.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
    >
      <div className="relative w-14 h-14 shrink-0 rounded-md overflow-hidden bg-zinc-700">
        {song.thumbnail_url ? (
          <Image
            src={song.thumbnail_url}
            alt={song.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-7 h-7 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55A4 4 0 1014 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
        {song.artist && (
          <p className="text-zinc-400 text-xs truncate">{song.artist}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {song.genre && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
              {song.genre}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
