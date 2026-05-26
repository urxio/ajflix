import UploadToggle from '@/components/UploadToggle'
import Link from 'next/link'

export default function UploadPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-1">Upload Content</h1>
      <p className="text-zinc-400 text-sm mb-8">Add a movie or TV show to ajflix</p>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <UploadToggle />
      </div>
    </div>
  )
}
