import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { r2, R2_BUCKET } from '@/lib/r2'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { filename, contentType } = await req.json()
  if (!filename || !contentType) {
    return NextResponse.json({ error: 'filename and contentType required' }, { status: 400 })
  }

  const key = `${Date.now()}-${filename.replace(/\s+/g, '_')}`

  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 3600 }
  )

  return NextResponse.json({ url, key })
}
