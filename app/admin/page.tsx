import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import AdminVideoList from './VideoList'
import AdminShowList from './ShowList'
import type { Video, Show } from '@/lib/types'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const [{ data: videos }, { data: shows }] = await Promise.all([
    supabase.from('videos').select('*').order('created_at', { ascending: false }),
    supabase.from('shows').select('*').order('created_at', { ascending: false }),
  ])

  const movieCount = videos?.length ?? 0
  const showCount = shows?.length ?? 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {movieCount} movie{movieCount !== 1 ? 's' : ''} · {showCount} show{showCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/codes"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold px-4 py-2 rounded-lg transition-colors text-sm border border-zinc-700"
          >
            🔑 Access Codes
          </Link>
          <Link
            href="/admin/upload"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            + Upload
          </Link>
          <AdminSignOut />
        </div>
      </div>

      {/* Movies */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Movies</h2>
        <AdminVideoList videos={(videos ?? []) as Video[]} />
      </section>

      {/* Shows */}
      <section>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">TV Shows</h2>
        <AdminShowList shows={(shows ?? []) as Show[]} />
      </section>
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
