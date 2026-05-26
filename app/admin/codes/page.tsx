import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CodesManager from './CodesManager'
import type { AccessCode } from '@/lib/types'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AccessCodesPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data } = await adminSupabase
    .from('access_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const codes = (data ?? []) as AccessCode[]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-zinc-500 hover:text-white text-sm transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">Access Codes</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Create and manage codes that let users access the site.
          </p>
        </div>
      </div>

      <CodesManager initial={codes} />
    </div>
  )
}
