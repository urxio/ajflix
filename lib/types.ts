export type Video = {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  genre: string | null
  duration: number | null
  views: number
  created_at: string
}
