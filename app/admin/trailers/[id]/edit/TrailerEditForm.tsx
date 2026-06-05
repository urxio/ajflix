'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Trailer } from '@/lib/types'

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

export default function TrailerEditForm({ trailer }: { trailer: Trailer }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(trailer.title)
  const [description, setDescription] = useState(trailer.description ?? '')
  const [genre, setGenre] = useState(trailer.genre ?? '')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    let thumbnailUrl = trailer.thumbnail_url
    let videoUrl = trailer.video_url

    if (thumbFile) {
      const thumbPath = `${Date.now()}-${thumbFile.name.replace(/\s+/g, '_')}`
      const { error } = await supabase.storage
        .from('thumbnails')
        .upload(thumbPath, thumbFile, { cacheControl: '3600', upsert: false })
      if (!error) {
        thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbPath).data.publicUrl
      }
    }

    if (videoFile) {
      try {
        videoUrl = await uploadToR2(videoFile, setProgress)
      } catch (err: unknown) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'Video upload failed')
        return
      }
    }

    const res = await fetch(`/api/trailers/${trailer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        genre: genre || null,
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl,
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setStatus('error')
      setErrorMsg(error || 'Failed to save changes')
      return
    }

    setStatus('done')
    setTimeout(() => router.push('/admin'), 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none" />
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Genre</label>
        <select value={genre} onChange={e => setGenre(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500">
          <option value="">— Select genre —</option>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Replace thumbnail</label>
        <input type="file" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] ?? null)}
          className="w-full text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600" />
        {trailer.thumbnail_url && !thumbFile && (
          <p className="text-xs text-zinc-500 mt-1">Current thumbnail kept if no new file selected.</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Replace video file</label>
        <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
          className="w-full text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600" />
        {!videoFile && <p className="text-xs text-zinc-500 mt-1">Current video kept if no new file selected.</p>}
      </div>

      {status === 'saving' && videoFile && (
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Uploading video…</span><span>{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {status === 'done' && <p className="text-green-400 text-sm bg-green-950/40 border border-green-900 rounded-lg px-3 py-2">Saved! Redirecting…</p>}
      {status === 'error' && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{errorMsg}</p>}

      <button type="submit" disabled={status === 'saving' || status === 'done'}
        className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold py-2 rounded-lg transition-colors">
        {status === 'saving' ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
