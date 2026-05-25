import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
        <Link href="/" className="text-red-600 font-extrabold text-2xl tracking-tight">
          ajflix
        </Link>
      </div>
    </nav>
  )
}
