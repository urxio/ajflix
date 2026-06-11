'use client'

import { useEffect, useRef, useState } from 'react'
import type { Comment } from '@/lib/types'

interface Props {
  contentType: 'video' | 'show'
  contentId: string
  canModerate?: boolean
}

export default function Comments({ contentType, contentId, canModerate = false }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justPosted, setJustPosted] = useState(false)
  const postedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setName(localStorage.getItem('ajflix_comment_name') ?? '')

    fetch(`/api/comments?type=${contentType}&id=${contentId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => {
      if (postedTimer.current) clearTimeout(postedTimer.current)
    }
  }, [contentType, contentId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting) return

    setSubmitting(true)
    setError(null)
    localStorage.setItem('ajflix_comment_name', name.trim())

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_type: contentType, content_id: contentId, name, body }),
    })

    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(data.error ?? 'Failed to post comment')
      return
    }

    setComments((prev) => [data.comment, ...prev])
    setBody('')

    // Minimize the section and dismiss the keyboard
    ;(document.activeElement as HTMLElement | null)?.blur()
    setOpen(false)
    setJustPosted(true)
    if (postedTimer.current) clearTimeout(postedTimer.current)
    postedTimer.current = setTimeout(() => setJustPosted(false), 3000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <section className="mt-10">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 hover:bg-zinc-800/70 transition-colors"
      >
        <span className="text-white font-semibold">
          Comments{!loading && ` (${comments.length})`}
        </span>
        <span className="flex items-center gap-2">
          {justPosted && <span className="text-green-500 text-xs font-medium">Posted ✓</span>}
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="mb-8">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={50}
              className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-base text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 mb-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              maxLength={1000}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-base text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="w-full sm:w-auto sm:ml-auto sm:flex mt-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors justify-center"
            >
              {submitting ? 'Posting…' : 'Comment'}
            </button>
          </form>

          {loading ? (
            <p className="text-zinc-600 text-sm">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="text-zinc-600 text-sm">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm font-semibold uppercase">
                    {comment.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{comment.name}</span>
                      <span className="text-zinc-600 text-xs shrink-0">{timeAgo(comment.created_at)}</span>
                      {canModerate && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-500 hover:text-red-400 text-xs ml-auto shrink-0"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-300 text-sm mt-1 whitespace-pre-wrap break-words">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
