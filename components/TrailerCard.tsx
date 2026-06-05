import Link from 'next/link'
import Image from 'next/image'
import type { Trailer } from '@/lib/types'

export default function TrailerCard({ trailer }: { trailer: Trailer }) {
  return (
    <Link
      href={`/trailers/${trailer.id}`}
      className="group block rounded-lg overflow-hidden bg-zinc-900 hover:scale-105 transition-transform duration-200"
    >
      <div className="relative aspect-video bg-zinc-800">
        {trailer.thumbnail_url ? (
          <Image
            src={trailer.thumbnail_url}
            alt={trailer.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-bold px-2 py-0.5 rounded">
          TRAILER
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{trailer.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {trailer.genre && (
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {trailer.genre}
            </span>
          )}
          <span className="text-xs text-zinc-500">{trailer.views.toLocaleString()} views</span>
        </div>
      </div>
    </Link>
  )
}
