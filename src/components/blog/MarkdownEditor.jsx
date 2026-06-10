import { useRef, useState } from 'react'
import {
  Bold, Code, Heading2, Heading3, Italic, Link,
  List, ListOrdered, Minus, Quote,
} from 'lucide-react'
import BlogContent from '@/components/blog/BlogContent'

const FORMATS = [
  { label: 'Heading 2', icon: Heading2, type: 'line', prefix: '## ' },
  { label: 'Heading 3', icon: Heading3, type: 'line', prefix: '### ' },
  { label: 'Bold', icon: Bold, type: 'wrap', before: '**', after: '**', fallback: 'bold text' },
  { label: 'Italic', icon: Italic, type: 'wrap', before: '_', after: '_', fallback: 'italic text' },
  { label: 'Bulleted list', icon: List, type: 'lines', prefix: '- ' },
  { label: 'Numbered list', icon: ListOrdered, type: 'numbered' },
  { label: 'Quote', icon: Quote, type: 'lines', prefix: '> ' },
  { label: 'Link', icon: Link, type: 'link' },
  { label: 'Inline code', icon: Code, type: 'wrap', before: '`', after: '`', fallback: 'code' },
  { label: 'Divider', icon: Minus, type: 'insert', value: '\n\n---\n\n' },
]

export default function MarkdownEditor({ id, value, onChange, required = false }) {
  const textareaRef = useRef(null)
  const [mode, setMode] = useState('write')

  function updateValue(nextValue, selectionStart, selectionEnd = selectionStart) {
    onChange({ target: { value: nextValue, type: 'textarea' } })
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  function applyFormat(format) {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    let replacement = selected
    let nextStart = start
    let nextEnd = end

    if (format.type === 'wrap') {
      const content = selected || format.fallback
      replacement = format.before + content + format.after
      nextStart = start + format.before.length
      nextEnd = nextStart + content.length
    }

    if (format.type === 'line') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEndIndex = value.indexOf('\n', end)
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
      const lines = value.slice(lineStart, lineEnd)
      const formatted = lines
        .split('\n')
        .map(line => format.prefix + line.replace(/^#{1,6}\s+/, ''))
        .join('\n')
      const nextValue = value.slice(0, lineStart) + formatted + value.slice(lineEnd)
      updateValue(nextValue, lineStart + format.prefix.length, lineStart + formatted.length)
      return
    }

    if (format.type === 'lines' || format.type === 'numbered') {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const lineEndIndex = value.indexOf('\n', end)
      const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex
      const lines = value.slice(lineStart, lineEnd).split('\n')
      const formatted = lines
        .map((line, index) => {
          const clean = line.replace(/^([-*+]|\d+\.)\s+/, '')
          return (format.type === 'numbered' ? (index + 1) + '. ' : format.prefix) + clean
        })
        .join('\n')
      const nextValue = value.slice(0, lineStart) + formatted + value.slice(lineEnd)
      updateValue(nextValue, lineStart, lineStart + formatted.length)
      return
    }

    if (format.type === 'link') {
      const text = selected || 'link text'
      const url = 'https://example.com'
      replacement = '[' + text + '](' + url + ')'
      nextStart = start + text.length + 3
      nextEnd = nextStart + url.length
    }

    if (format.type === 'insert') {
      replacement = format.value
      nextStart = start + replacement.length
      nextEnd = nextStart
    }

    updateValue(value.slice(0, start) + replacement + value.slice(end), nextStart, nextEnd)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-400">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Blog content formatting">
          {FORMATS.map(({ label, icon: Icon, ...format }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setMode('write')
                requestAnimationFrame(() => applyFormat(format))
              }}
              aria-label={label}
              title={label}
              className="flex size-8 items-center justify-center rounded-md text-gray-600 hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Icon size={16} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5" aria-label="Editor mode">
          {['write', 'preview'].map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              aria-pressed={mode === option}
              className={[
                'rounded px-3 py-1 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-blue-500',
                mode === option ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
              ].join(' ')}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={onChange}
          rows={14}
          required={required}
          placeholder="Write the post, then use the toolbar to add headings, lists, links, quotes, and emphasis."
          className="block w-full resize-y border-0 px-4 py-3 font-mono text-sm leading-6 text-gray-800 focus:outline-none"
        />
      ) : (
        <div className="min-h-[336px] bg-white px-5 py-4">
          {value.trim() ? (
            <BlogContent content={value} />
          ) : (
            <p className="text-sm text-gray-400">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
