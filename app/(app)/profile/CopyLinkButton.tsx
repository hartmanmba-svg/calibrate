'use client'

import { useState } from 'react'

interface Props {
  url: string
}

export function CopyLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text via a temp input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`font-body text-sm px-4 py-2 rounded-lg border transition
        ${copied
          ? 'border-green/30 bg-green/10 text-green'
          : 'border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] text-muted hover:text-white hover:border-[rgba(255,255,255,0.30)]'
        }`}
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
