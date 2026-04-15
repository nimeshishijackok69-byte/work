'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShareLinkCopyProps {
  url: string
}

export function ShareLinkCopy({ url }: ShareLinkCopyProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Button onClick={handleCopy} size="sm" variant="outline">
      {copied ? (
        <>
          <Check className="size-4 text-emerald-500" />
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="size-4" />
          Copy
        </>
      )}
    </Button>
  )
}
