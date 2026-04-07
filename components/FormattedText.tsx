import React from 'react'

const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi

interface FormattedTextProps {
  text: string
  className?: string
}

export default function FormattedText({ text, className }: FormattedTextProps) {
  // Reset lastIndex since we reuse the regex
  const parts = text.split(/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi)

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^(https?:\/\/|www\.)/i.test(part)) {
          const href = part.startsWith('http') ? part : `https://${part}`
          return (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4da3ff] underline underline-offset-2 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </span>
  )
}
