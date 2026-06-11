import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_TYPES = ['video', 'show']

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!type || !VALID_TYPES.includes(type) || !id) {
    return NextResponse.json({ error: 'Invalid type or id' }, { status: 400 })
  }

  const { data, error } = await adminSupabase
    .from('comments')
    .select('*')
    .eq('content_type', type)
    .eq('content_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data })
}

export async function POST(req: Request) {
  const { content_type, content_id, name, body } = await req.json()

  if (!content_type || !VALID_TYPES.includes(content_type) || !content_id) {
    return NextResponse.json({ error: 'Invalid type or id' }, { status: 400 })
  }

  const trimmedBody = typeof body === 'string' ? body.trim() : ''
  if (!trimmedBody) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
  }
  if (trimmedBody.length > 1000) {
    return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 })
  }

  const trimmedName = (typeof name === 'string' ? name.trim() : '').slice(0, 50) || 'Anonymous'

  const { data, error } = await adminSupabase
    .from('comments')
    .insert({
      content_type,
      content_id,
      name: trimmedName,
      body: trimmedBody,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
