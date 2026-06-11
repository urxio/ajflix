import { createClient } from '@/lib/supabase/server'
import ShowPlayer from '@/components/ShowPlayer'
import Comments from '@/components/Comments'
import { notFound } from 'next/navigation'
import type { Show, Episode } from '@/lib/types'

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: showData } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .single()

  if (!showData) notFound()

  const show = showData as Show

  const { data: episodesData } = await supabase
    .from('episodes')
    .select('*')
    .eq('show_id', id)
    .order('season', { ascending: true })
    .order('episode', { ascending: true })

  const episodes = (episodesData ?? []) as Episode[]

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ShowPlayer show={show} episodes={episodes} />
      <Comments contentType="show" contentId={show.id} canModerate={!!user} />
    </div>
  )
}
