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

export type Trailer = {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  genre: string | null
  views: number
  likes: number
  dislikes: number
  created_at: string
}

export type Song = {
  id: string
  title: string
  artist: string | null
  description: string | null
  audio_url: string
  thumbnail_url: string | null
  genre: string | null
  duration: number | null
  views: number
  likes: number
  dislikes: number
  created_at: string
}

export type AccessCode = {
  id: string
  code: string
  label: string | null
  is_active: boolean
  uses: number
  created_at: string
}