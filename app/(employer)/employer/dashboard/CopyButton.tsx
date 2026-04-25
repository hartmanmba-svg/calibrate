'use client'

import { useState } from 'react'

interface Props {
  text: string
}

export function CopyButton({ text }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: temp input element
      const input = document.createElement('input')
      input.value = text
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
      className={`font-body text-sm px-4 py-2 rounded-lg border transition flex-shrink-0
        ${copied
          ? 'border-green/30 bg-green/10 text-green'
          : 'border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] text-muted hover:text-white hover:border-[rgba(255,255,255,0.30)]'
        }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
