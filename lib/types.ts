export type Video = {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  genre: string | null
  duration: number | null
  views: number
  likes: number
  dislikes: number
  created_at: string
}

export type Show = {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  genre: string | null
  likes: number
  dislikes: number
  created_at: string
}

export type Episode = {
  id: string
  show_id: string
  season: number
  episode: number
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  duration: number | null
  created_at: string
}