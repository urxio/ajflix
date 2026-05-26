import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Action = 'like' | 'unlike' | 'dislike' | 'undislike'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { action } = (await req.json()) as { action: Action }

  const delta: Record<string, number> = {}
  if (action === 'like')      delta.likes    =  1
  if (action === 'unlike')    delta.likes    = -1
  if (action === 'dislike')   delta.dislikes =  1
  if (action === 'undislike') delta.dislikes = -1

  if (Object.keys(delta).length === 0)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { data: current } = await adminSupabase
    .from('shows').select('likes, dislikes').eq('id', id).single()

  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, number> = {}
  if ('likes' in delta)    update.likes    = Math.max(0, current.likes    + delta.likes)
  if ('dislikes' in delta) update.dislikes = Math.max(0, current.dislikes + delta.dislikes)

  const { data, error } = await adminSupabase
    .from('shows').update(update).eq('id', id).select('likes, dislikes').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
