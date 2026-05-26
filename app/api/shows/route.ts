import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EpisodePayload {
  season: number
  episode: number
  title: string
  description?: string
  video_url: string
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, thumbnail_url, genre, episodes } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!Array.isArray(episodes) || episodes.length === 0) {
    return NextResponse.json({ error: 'At least one episode is required' }, { status: 400 })
  }

  const { data: show, error: showError } = await adminSupabase
    .from('shows')
    .insert({
      title: title.trim(),
      description: description?.trim() || null,
      thumbnail_url: thumbnail_url || null,
      genre: genre || null,
    })
    .select()
    .single()

  if (showError) {
    console.error('Show insert error:', showError)
    return NextResponse.json({ error: showError.message }, { status: 500 })
  }

  const rows = (episodes as EpisodePayload[]).map((ep) => ({
    show_id: show.id,
    season: ep.season,
    episode: ep.episode,
    title: ep.title.trim(),
    description: ep.description?.trim() || null,
    video_url: ep.video_url,
  }))

  const { error: epError } = await adminSupabase.from('episodes').insert(rows)
  if (epError) {
    console.error('Episode insert error:', epError)
    return NextResponse.json({ error: epError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, show_id: show.id })
}
