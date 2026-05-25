import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const { data, error } = await adminSupabase
    .from('comments')
    .select('*')
    .eq('video_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { author_name, body } = await req.json()

  if (!author_name?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Name and comment are required' }, { status: 400 })
  }

  if (author_name.trim().length > 50 || body.trim().length > 1000) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400 })
  }

  const { data, error } = await adminSupabase
    .from('comments')
    .insert({ video_id: id, author_name: author_name.trim(), body: body.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
