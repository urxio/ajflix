'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Show, Episode } from '@/lib/types'

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

export default function ShowEditForm({ show, episodes: initialEpisodes }: { show: Show; episodes: Episode[] }) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(show.title)
  const [description, setDescription] = useState(show.description ?? '')
  const [genre, setGenre] = useState(show.genre ?? '')
  const [thumbFile, setThumbFile] = useState<File | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes)
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [deletingEp, setDeletingEp] = useState<string | null>(null)
  const [newEp, setNewEp] = useState({ season: 1, episode: (initialEpisodes.length + 1), title: '', videoFile: null as File | null })
  const [addingEp, setAddingEp] = useState(false)
  const [epProgress, setEpProgress] = useState(0)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    let thumbnailUrl = show.thumbnail_url
    if (thumbFile) {
      const thumbPath = `${Date.now()}-${thumbFile.name.replace(/\s+/g, '_')}`
      const { error } = await supabase.storage.from('thumbnails').upload(thumbPath, thumbFile, { cacheControl: '3600', upsert: false })
      if (!error) thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbPath).data.publicUrl
    }

    const res = await fetch(`/api/shows/${show.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description.trim() || null, genre: genre || null, thumbnail_url: thumbnailUrl }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      setStatus('error')
      setErrorMsg(error || 'Failed to save')
      return
    }
    setStatus('done')
    setTimeout(() => router.push('/admin'), 1000)
  }

  async function handleDeleteEpisode(ep: Episode) {
    if (!confirm(`Delete episode "${ep.title}"?`)) return
    setDeletingEp(ep.id)
    await fetch(`/api/episodes/${ep.id}`, { method: 'DELETE' })
    setEpisodes(prev => prev.filter(e => e.id !== ep.id))
    setDeletingEp(null)
  }

  async function handleAddEpisode() {
    if (!newEp.videoFile || !newEp.title.trim()) return
    setAddingEp(true)
    setEpProgress(0)

    try {
      const videoUrl = await uploadToR2(newEp.videoFile, setEpProgress)
      const res = await fetch(`/api/shows/${show.id}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season: newEp.season, episode: newEp.episode, title: newEp.title.trim(), video_url: videoUrl }),
      })
      if (res.ok) {
        const { episode } = await res.json()
        setEpisodes(prev => [...prev, episode])
        setNewEp({ season: newEp.season, episode: newEp.episode + 1, title: '', videoFile: null })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    }
    setAddingEp(false)
  }

  return (
    <div className="space-y-8">
      {/* Metadata form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 resize-none" />
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Genre</label>
          <select value={genre} onChange={e => setGenre(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600">
            <option value="">— Select genre —</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-zinc-300 mb-1">Replace thumbnail</label>
          <input type="file" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] ?? null)}
            className="w-full text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-700 file:text-white file:cursor-pointer hover:file:bg-zinc-600" />
        </div>
        {status === 'done' && <p className="text-green-400 text-sm bg-green-950/40 border border-green-900 rounded-lg px-3 py-2">Saved!</p>}
        {status === 'error' && <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{errorMsg}</p>}
        <button type="submit" disabled={status === 'saving' || status === 'done'}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors">
          {status === 'saving' ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div className="border-t border-zinc-800" />

      {/* Episodes management */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Episodes</h3>
        <div className="space-y-2 mb-4">
          {episodes.length === 0 && <p className="text-zinc-600 text-sm">No episodes yet.</p>}
          {episodes.map(ep => (
            <div key={ep.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-2.5 border border-zinc-700/50">
              <span className="text-sm text-white">S{ep.season}E{ep.episode} — {ep.title}</span>
              <button onClick={() => handleDeleteEpisode(ep)} disabled={deletingEp === ep.id}
                className="text-red-400 hover:text-red-300 text-xs border border-red-900 hover:border-red-700 px-2 py-1 rounded transition-colors disabled:opacity-50">
                {deletingEp === ep.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        {/* Add episode */}
        <div className="bg-zinc-800/30 rounded-lg p-4 border border-dashed border-zinc-700 space-y-3">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Add Episode</h4>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Season</label>
              <input type="number" min={1} value={newEp.season} onChange={e => setNewEp(p => ({ ...p, season: Number(e.target.value) }))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Ep.</label>
              <input type="number" min={1} value={newEp.episode} onChange={e => setNewEp(p => ({ ...p, episode: Number(e.target.value) }))}
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-600" />
            </div>
            <div className="col-span-8">
              <label className="block text-xs text-zinc-500 mb-1">Title *</label>
              <input type="text" value={newEp.title} onChange={e => setNewEp(p => ({ ...p, title: e.target.value }))} placeholder="Episode title"
                className="w-full bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-600" />
            </div>
            <div className="col-span-12">
              <label className="block text-xs text-zinc-500 mb-1">Video file *</label>
              <input type="file" accept="video/*" onChange={e => setNewEp(p => ({ ...p, videoFile: e.target.files?.[0] ?? null }))}
                className="w-full text-zinc-300 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-zinc-600 file:text-white file:cursor-pointer hover:file:bg-zinc-500" />
            </div>
          </div>
          {addingEp && (
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1"><span>Uploading…</span><span>{epProgress}%</span></div>
              <div className="w-full bg-zinc-700 rounded-full h-1">
                <div className="bg-red-600 h-1 rounded-full transition-all" style={{ width: `${epProgress}%` }} />
              </div>
            </div>
          )}
          <button onClick={handleAddEpisode} disabled={addingEp || !newEp.videoFile || !newEp.title.trim()}
            className="w-full py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 text-white text-sm font-medium transition-colors">
            {addingEp ? 'Uploading…' : '+ Add Episode'}
          </button>
        </div>
      </div>
    </div>
  )
}
