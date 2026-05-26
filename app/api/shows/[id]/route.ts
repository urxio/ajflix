import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get show to delete thumbnail
  const { data: show } = await adminSupabase.from('shows').select('*').eq('id', id).single()

  if (show?.thumbnail_url) {
    const thumbPath = show.thumbnail_url.split('/thumbnails/')[1]
    if (thumbPath) await adminSupabase.storage.from('thumbnails').remove([thumbPath])
  }

  // Episodes cascade-delete via FK
  const { error } = await adminSupabase.from('shows').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
