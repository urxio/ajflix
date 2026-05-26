'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Documentary', 'Animation', 'Thriller', 'Other']
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!

async function uploadToR2(file: File, onProgress: (pct: number) => void): Promise<string> {
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  const { url, key } = await res.json()

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`))
    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })

  return `${R2_PUBLIC_URL}/${key}`
}

interface EpisodeInput {
  localId: string
  season: number
  episode: number
  title: string
  description: string
  videoFile: File | null
  uploadStatus: 'idle' | 'uploading' | 'done' | 'error'
  uploadProgress: number
}

function makeEpisode(season: number, episode: number): EpisodeInput {
  return {
    localId: crypto.randomUUID(),
    season,
    episode,
    title: '',
    description: '',
    videoFile: null,
    uploadStatus: 'idle',
    uploadProgress: 0,
  }
}

export default function ShowUploadForm() {
  const router = useRouter()
  const [showTitle, setShowTitle] = useState('')
  const [showDescription, setShowDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [episodes, setEpisodes] = useState<EpisodeInput[]>([makeEpisode(1, 1)])
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const episodesRef = useRef(episodes)
  episodesRef.current = episodes

  function updateEp(localId: string, patch: Partial<EpisodeInput>) {
    setEpisodes(prev => prev.map(ep => ep.localId === localId ? { ...ep, ...patch } : ep))
  }

  function addEpisode() {
    setEpisodes(prev => {
      const last = prev[prev.length - 1]
      return [...prev, makeEpisode(last?.season ?? 1, (last?.episode ?? 0) + 1)]
    })
  }

  function removeEpisode(localId: string) {
    setEpisodes(prev => prev.filter(ep => ep.localId !== localId))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (globalStatus === 'uploading' || globalStatus === 'done') return

    setGlobalStatus('uploading')
    setErrorMsg('')

    const supabase = createClient()
    const uploadedEpisodes: object[] = []

    // Upload each episode video to R2 sequentially
    for (const ep of episodesRef.current) {
      updateEp(ep.localId, { uploadStatus: 'uploading', uploadProgress: 0 })
      try {
        const url = await uploadToR2(ep.videoFile!, (pct) => {
          updateEp(ep.localId, { uploadProgress: pct })
        })
        updateEp(ep.localId, { uploadStatus: 'done', uploadProgress: 100 })
        uploadedEpisodes.push({
          season: ep.season,
          episode: ep.episode,
          title: ep.title.trim(),
          description: ep.description.trim() || null,
          video_url: url,
        })
      } catch (err: unknown) {
        updateEp(ep.localId, { uploadStatus: 'error' })
        setGlobalStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Episode upload failed')
        return
      }
    }

    // Upload show thumbnail
    let thumbnailUrl: string | null = null
    if (thumbFile) {
      const thumbPath = `${Date.now()}-${thumbFile.name.replace(/\s+/g, '_')}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(thumbPath, thumbFile, { cacheControl: '3600', upsert: false })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath)
        thumbnailUrl = publicUrl
      }
    }

    // Save to DB
    const res = await fetch('/api/shows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: showTitle.trim(),
        description: showDescription.trim() || null,
        thumbnail_url: thumbnailUrl,
        genre: genre || null,
        episodes: uploadedEpisodes,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setGlobalStatus('error')
      setErrorMsg(error || 'Failed to save show')
      return
    }

    setGlobalStatus('done')
    setTimeout(() => router.push('/admin'), 1500)
  }

  const canSubmit =
    showTitle.trim().length > 0 &&
    episodes.length > 0 &&
    episodes.every(ep => ep.videoFile && ep.title.trim().length > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show metadata */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Show Title *</label>
          <input
            type="text"
            value={showTitle}
            onChange={e => setShowTitle(e.target.value)}
            required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600"
            placeholder="Show title"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-300 mb-1">Description</label>
          <textarea
            value={showDescription}
            onChange={e => setShowDescription(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
            placeholder="Short description…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Genre</label>
            <select
              value={genre}
              onChange={e => setGenre(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">— Select genre —</option>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-300 mb-1">Cover image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setThumbFile(e.target.files?.[0] ?? null)}
              className="w-full text-zinc-300 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800" />

      {/* Episodes */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-4">Episodes</h3>
        <div className="space-y-3">
          {episodes.map((ep, i) => (
            <div key={ep.localId} className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Episode {i + 1}
                </span>
                {episodes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEpisode(ep.localId)}
                    className="text-zinc-600 hover:text-zinc-300 text-xl leading-none transition-colors"
                    aria-label="Remove episode"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Season</label>
                  <input
                    type="number"
                    min={1}
                    value={ep.season}
                    onChange={e => updateEp(ep.localId, { season: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Ep.</label>
                  <input
                    type="number"
                    min={1}
                    value={ep.episode}
                    onChange={e => updateEp(ep.localId, { episode: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div className="col-span-8">
                  <label className="block text-xs text-zinc-500 mb-1">Title *</label>
                  <input
                    type="text"
                    value={ep.title}
                    onChange={e => updateEp(ep.localId, { title: e.target.value })}
                    placeholder="Episode title"
                    className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div className="col-span-12">
                  <label className="block text-xs text-zinc-500 mb-1">Video file *</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => updateEp(ep.localId, { videoFile: e.target.files?.[0] ?? null, uploadStatus: 'idle' })}
                    className="w-full text-zinc-300 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-white file:cursor-pointer hover:file:bg-zinc-500"
                  />
                </div>
              </div>

              {ep.uploadStatus === 'uploading' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Uploading…</span>
                    <span>{ep.uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-1">
                    <div
                      className="bg-red-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${ep.uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {ep.uploadStatus === 'done' && (
                <p className="mt-2 text-xs text-green-400">Uploaded</p>
              )}
              {ep.uploadStatus === 'error' && (
                <p className="mt-2 text-xs text-red-400">Upload failed</p>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEpisode}
          disabled={globalStatus === 'uploading'}
          className="mt-3 w-full py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 text-sm transition-colors disabled:opacity-40"
        >
          + Add Episode
        </button>
      </div>

      {globalStatus === 'done' && (
        <p className="text-green-400 text-sm bg-green-950/40 border border-green-900 rounded-lg px-3 py-2">
          Upload complete! Redirecting…
        </p>
      )}
      {globalStatus === 'error' && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || globalStatus === 'uploading' || globalStatus === 'done'}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
      >
        {globalStatus === 'uploading' ? 'Uploading…' : 'Upload Show'}
      </button>
    </form>
  )
}
