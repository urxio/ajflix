'use client'

import { useState, useEffect } from 'react'

type Reaction = 'liked' | 'disliked' | null

interface Props {
  videoId?: string
  showId?: string
  initialLikes: number
  initialDislikes: number
}

export default function LikeDislike({ videoId, showId, initialLikes, initialDislikes }: Props) {
  const id = videoId ?? showId!
  const endpoint = videoId ? `/api/videos/${id}/reactions` : `/api/shows/${id}/reactions`

  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [reaction, setReaction] = useState<Reaction>(null)
  const storageKey = `ajflix_reaction_${id}`

  useEffect(() => {
    setReaction(localStorage.getItem(storageKey) as Reaction)
  }, [storageKey])

  async function react(type: 'like' | 'dislike') {
    const activeKey = type === 'like' ? 'liked' : 'disliked'
    const isActive = reaction === activeKey
    const hasOpposite = type === 'like' ? reaction === 'disliked' : reaction === 'liked'

    const calls: Array<'like' | 'unlike' | 'dislike' | 'undislike'> = []
    if (hasOpposite) calls.push(type === 'like' ? 'undislike' : 'unlike')
    calls.push(isActive ? (type === 'like' ? 'unlike' : 'undislike') : type)

    // Optimistic update
    let l = likes, d = dislikes
    for (const c of calls) {
      if (c === 'like')      l++
      if (c === 'unlike')    l = Math.max(0, l - 1)
      if (c === 'dislike')   d++
      if (c === 'undislike') d = Math.max(0, d - 1)
    }
    const next: Reaction = isActive ? null : activeKey
    setLikes(l); setDislikes(d); setReaction(next)
    if (next) localStorage.setItem(storageKey, next)
    else localStorage.removeItem(storageKey)

    for (const action of calls) {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => react('like')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          reaction === 'liked'
            ? 'bg-white text-black'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        <ThumbsUp active={reaction === 'liked'} />
        <span>{likes.toLocaleString()}</span>
      </button>

      <button
        onClick={() => react('dislike')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          reaction === 'disliked'
            ? 'bg-zinc-500 text-white'
            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
      >
        <ThumbsDown active={reaction === 'disliked'} />
        <span>{dislikes.toLocaleString()}</span>
      </button>
    </div>
  )
}

function ThumbsUp({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function ThumbsDown({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  )
}
