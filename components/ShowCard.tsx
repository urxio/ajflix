import Link from 'next/link'
import Image from 'next/image'
import type { Show } from '@/lib/types'

export default function ShowCard({ show }: { show: Show }) {
  return (
    <Link
      href={`/shows/${show.id}`}
      className="group block rounded-lg overflow-hidden bg-zinc-900 hover:scale-105 transition-transform duration-200"
    >
      <div className="relative aspect-video bg-zinc-800">
        {show.thumbnail_url ? (
          <Image
            src={show.thumbnail_url}
            alt={show.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">SERIES</span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      </div>
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{show.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {show.genre && (
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {show.genre}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
