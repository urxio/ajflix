import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET } from '@/lib/r2'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, genre, thumbnail_url, video_url, old_video_url } = body

  // If video file was replaced, delete old one from R2
  if (old_video_url && video_url && old_video_url !== video_url) {
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
    if (old_video_url.startsWith(r2PublicUrl)) {
      const key = old_video_url.replace(`${r2PublicUrl}/`, '')
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    }
  }

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (genre !== undefined) updates.genre = genre
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url
  if (video_url !== undefined) updates.video_url = video_url

  const { error } = await adminSupabase.from('videos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Get video to find file URLs
  const { data: video } = await adminSupabase.from('videos').select('*').eq('id', id).single()

  if (video) {
    // Delete video from R2
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
    if (video.video_url?.startsWith(r2PublicUrl)) {
      const key = video.video_url.replace(`${r2PublicUrl}/`, '')
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    }

    // Delete thumbnail from Supabase storage
    if (video.thumbnail_url) {
      const thumbPath = video.thumbnail_url.split('/thumbnails/')[1]
      if (thumbPath) await adminSupabase.storage.from('thumbnails').remove([thumbPath])
    }
  }

  const { error } = await adminSupabase.from('videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
