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