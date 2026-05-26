import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.json()
  const code: string = (body.code ?? '').trim().toUpperCase()

  if (!code) {
    return NextResponse.json({ error: 'Code is required.' }, { status: 400 })
  }

  const { data, error } = await adminSupabase
    .from('access_codes')
    .select('id, is_active, uses')
    .eq('code', code)
    .single()

  if (error || !data || !data.is_active) {
    return NextResponse.json({ error: 'Invalid or inactive access code.' }, { status: 400 })
  }

  // Increment usage counter
  await adminSupabase
    .from('access_codes')
    .update({ uses: data.uses + 1 })
    .eq('id', data.id)

  // Set the access cookie (30 days)
  const cookieStore = await cookies()
  cookieStore.set('ajflix_access', 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return NextResponse.json({ success: true })
}
