'use client'

import { useState } from 'react'
import type { AccessCode } from '@/lib/types'

function generateCode() {
  // Avoids ambiguous chars (0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 9; i++) {
    if (i === 4) { code += '-'; continue }
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code // e.g. "WXVK-3M9P"
}

export default function CodesManager({ initial }: { initial: AccessCode[] }) {
  const [codes, setCodes] = useState<AccessCode[]>(initial)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  function handleGenerate() {
    setNewCode(generateCode())
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    const res = await fetch('/api/admin/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, label: newLabel }),
    })

    const data = await res.json()

    if (!res.ok) {
      setCreateError(data.error ?? 'Failed to create code.')
      setCreating(false)
      return
    }

    setCodes([data, ...codes])
    setNewCode('')
    setNewLabel('')
    setCreating(false)
  }

  async function handleToggle(code: AccessCode) {
    const res = await fetch(`/api/admin/codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !code.is_active }),
    })

    if (res.ok) {
      setCodes(codes.map((c) => c.id === code.id ? { ...c, is_active: !c.is_active } : c))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this access code? Users with this code will lose access.')) return

    const res = await fetch(`/api/admin/codes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCodes(codes.filter((c) => c.id !== id))
    }
  }

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4">Create Access Code</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-zinc-400 mb-1">Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="XXXX-XXXX"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono tracking-widest uppercase placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="shrink-0 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-xs text-zinc-400 mb-1">Label <span className="text-zinc-600">(optional)</span></label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Friends &amp; Family"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
              />
            </div>
          </div>

          {createError && (
            <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={creating || newCode.trim().length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm"
          >
            {creating ? 'Creating…' : 'Create Code'}
          </button>
        </form>
      </div>

      {/* Codes table */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          {codes.length} Code{codes.length !== 1 ? 's' : ''}
        </h2>

        {codes.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 border border-zinc-800 rounded-xl">
            No access codes yet. Create one above.
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Code</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Label</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Uses</th>
                  <th className="text-left px-4 py-3 text-zinc-400 font-medium">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {codes.map((code, i) => (
                  <tr
                    key={code.id}
                    className={`border-b border-zinc-800 last:border-0 ${i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/30'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white tracking-widest">{code.code}</span>
                        <button
                          onClick={() => handleCopy(code.code)}
                          title="Copy code"
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          {copied === code.code ? (
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{code.label ?? <span className="text-zinc-700">—</span>}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(code)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          code.is_active
                            ? 'bg-green-950/60 text-green-400 border border-green-800 hover:bg-red-950/60 hover:text-red-400 hover:border-red-800'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-green-950/60 hover:text-green-400 hover:border-green-800'
                        }`}
                        title={code.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${code.is_active ? 'bg-green-400' : 'bg-zinc-500'}`} />
                        {code.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">{code.uses}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {new Date(code.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                        title="Delete code"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
