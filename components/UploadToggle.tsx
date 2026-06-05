'use client'

import { useState } from 'react'
import UploadForm from './UploadForm'
import ShowUploadForm from './ShowUploadForm'
import TrailerUploadForm from './TrailerUploadForm'
import SongUploadForm from './SongUploadForm'

type ContentType = 'movie' | 'show' | 'trailer' | 'song'

const TABS: { type: ContentType; label: string }[] = [
  { type: 'movie', label: 'Movie' },
  { type: 'show', label: 'TV Show' },
  { type: 'trailer', label: 'Trailer' },
  { type: 'song', label: 'Song' },
]

export default function UploadToggle() {
  const [type, setType] = useState<ContentType>('movie')

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden border border-zinc-700 mb-6">
        {TABS.map(({ type: t, label }) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              type === t
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {type === 'movie' && <UploadForm />}
      {type === 'show' && <ShowUploadForm />}
      {type === 'trailer' && <TrailerUploadForm />}
      {type === 'song' && <SongUploadForm />}
    </div>
  )
}
