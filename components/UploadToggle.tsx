'use client'

import { useState } from 'react'
import UploadForm from './UploadForm'
import ShowUploadForm from './ShowUploadForm'

type ContentType = 'movie' | 'show'

export default function UploadToggle() {
  const [type, setType] = useState<ContentType>('movie')

  return (
    <div>
      <div className="flex rounded-lg overflow-hidden border border-zinc-700 mb-6">
        {(['movie', 'show'] as ContentType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
              type === t
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t === 'movie' ? 'Movie' : 'TV Show'}
          </button>
        ))}
      </div>

      {type === 'movie' ? <UploadForm /> : <ShowUploadForm />}
    </div>
  )
}
