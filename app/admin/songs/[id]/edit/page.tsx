import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import SongEditForm from './SongEditForm'
import type { Song } from '@/lib/types'

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data } = await supabase.from('songs').select('*').eq('id', id).single()
  if (!data) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <a href="/admin" className="text-zinc-400 hover:text-white transition-colors text-sm">← Dashboard</a>
      <h1 className="text-2xl font-bold text-white mt-4 mb-1">Edit Song</h1>
      <p className="text-zinc-400 text-sm mb-8">Update metadata, cover art, or replace the audio file.</p>
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <SongEditForm song={data as Song} />
      </div>
    </div>
  )
}
