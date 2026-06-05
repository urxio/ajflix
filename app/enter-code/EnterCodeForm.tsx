'use client'

import { useState } from 'react'

export default function EnterCodeForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/access/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })

    if (res.ok) {
      window.location.href = '/'
    } else {
      const data = await res.json()
      setError(data.error ?? 'Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl font-extrabold text-red-600 tracking-tight">ajflix</span>
        </div>

        <div className="bg-zinc-900 rounded-xl p-8 shadow-2xl border border-zinc-800">
          <h1 className="text-2xl font-bold text-white mb-1">Access Required</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Enter your access code to continue watching.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1">Access Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 font-mono tracking-widest text-center text-lg uppercase focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="XXXX-XXXX"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Verifying…' : 'Access Site'}
            </button>
          </form>

          <p className="text-zinc-600 text-xs text-center mt-6">
            Don&apos;t have a code? Contact the site owner.
          </p>
        </div>
      </div>
    </div>
  )
}
