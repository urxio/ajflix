import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: Request, { params }: { params: Promise<{ epId: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { epId } = await params
  const { data: ep } = await adminSupabase.from('episodes').select('*').eq('id', epId).single()

  if (ep?.video_url) {
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
    if (ep.video_url.startsWith(r2PublicUrl)) {
      const key = ep.video_url.replace(`${r2PublicUrl}/`, '')
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    }
  }

  const { error } = await adminSupabase.from('episodes').delete().eq('id', epId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
