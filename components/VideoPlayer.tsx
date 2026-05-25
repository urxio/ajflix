'use client'

import { useRef } from 'react'

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        className="w-full aspect-video"
        playsInline
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
