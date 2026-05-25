'use client'

import { useState, useEffect } from 'react'
import type { Comment } from '@/lib/types'

function timeAgo(date: string): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Comments({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/videos/${videoId}/comments`)
      .then(r => r.json())
      .then(data => { setComments(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [videoId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !body.trim() || submitting) return
    setError('')
    setSubmitting(true)

    const res = await fetch(`/api/videos/${videoId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: name.trim(), body: body.trim() }),
    })

    if (res.ok) {
      const comment: Comment = await res.json()
      setComments(prev => [comment, ...prev])
      setBody('')
    } else {
      setError('Failed to post comment. Try again.')
    }

    setSubmitting(false)
  }

  const canSubmit = name.trim().length > 0 && body.trim().length > 0 && !submitting

  return (
    <section className="mt-10 border-t border-zinc-800 pt-8">
      <h2 className="text-base font-semibold text-white mb-6">
        {loading ? 'Comments' : comments.length > 0 ? `${comments.length} Comment${comments.length !== 1 ? 's' : ''}` : 'Comments'}
      </h2>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="mb-10 space-y-3">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={50}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        <textarea
          placeholder="Add a comment…"
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="bg-white text-black text-sm font-semibold px-5 py-2 rounded-full disabled:opacity-30 hover:bg-zinc-200 transition-colors"
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-24" />
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-zinc-600 text-sm">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map(comment => (
            <li key={comment.id} className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 select-none">
                {comment.author_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{comment.author_name}</span>
                  <span className="text-xs text-zinc-600">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
