import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminVideoList from './VideoList'
import type { Video } from '@/lib/types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">{videos?.length ?? 0} videos uploaded</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/upload"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Upload Video
          </Link>
          <AdminSignOut />
        </div>
      </div>

      <AdminVideoList videos={(videos ?? []) as Video[]} />
    </div>
  )
}

function AdminSignOut() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-4 py-2 rounded-lg transition-colors text-sm"
      >
        Sign Out
      </button>
    </form>
  )
}
