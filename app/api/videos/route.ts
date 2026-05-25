import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  // Check env vars are present
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ error: 'Server misconfiguration: missing service role key' }, { status: 500 })
  }

  // Verify the user is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, video_url, thumbnail_url, genre } = body

  const { error } = await adminSupabase.from('videos').insert({
    title,
    description: description || null,
    video_url,
    thumbnail_url: thumbnail_url || null,
    genre: genre || null,
  })

  if (error) {
    console.error('DB insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
