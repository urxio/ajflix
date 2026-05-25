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

export default function UploadForm() {
  const router = useRouter()
  const videoRef = useRef<HTMLInputElement>(null)
  const thumbRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!videoFile) return

    setStatus('uploading')
    setProgress(0)
    setErrorMsg('')

    const supabase = createClient()

    // Upload video to R2
    let videoUrl: string
    try {
      videoUrl = await uploadToR2(videoFile, (pct) => setProgress(Math.round(pct * 0.6)))
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Video upload failed')
      return
    }

    setProgress(60)

    // Upload thumbnail to Supabase (images are small, under 50MB)
    let thumbnailUrl: string | null = null
    if (thumbFile) {
      const thumbPath = `${Date.now()}-${thumbFile.name.replace(/\s+/g, '_')}`
      const { error: thumbError } = await supabase.storage
        .from('thumbnails')
        .upload(thumbPath, thumbFile, { cacheControl: '3600', upsert: false })

      if (!thumbError) {
        const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(thumbPath)
        thumbnailUrl = publicUrl
      }
    }

    setProgress(80)

    // Save metadata via server API route (uses service role key)
    const dbRes = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        genre: genre || null,
      }),
    })

    if (!dbRes.ok) {
      const { error } = await dbRes.json()
      setStatus('error')
      setErrorMsg(error || 'Failed to save video')
      return
    }

    setProgress(100)
    setStatus('done')
    setTimeout(() => router.push('/admin'), 1500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-zinc-300 mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="Movie title"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
          placeholder="Short description…"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Genre</label>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
        >
          <option value="">— Select genre —</option>
          {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Video file *</label>
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
          required
          className="w-full text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600"
        />
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1">Thumbnail (optional)</label>
        <input
          ref={thumbRef}
          type="file"
          accept="image/*"
          onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
          className="w-full text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600"
        />
      </div>

      {status === 'uploading' && (
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="text-green-400 text-sm bg-green-950/40 border border-green-900 rounded-lg px-3 py-2">
          Upload complete! Redirecting…
        </p>
      )}

      {status === 'error' && (
        <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'uploading' || status === 'done'}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
      >
        {status === 'uploading' ? 'Uploading…' : 'Upload Video'}
      </button>
    </form>
  )
}
