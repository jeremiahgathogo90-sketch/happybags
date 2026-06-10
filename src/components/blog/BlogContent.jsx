import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

export function markdownToPlainText(value = '') {
  return String(value)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const components = {
  h1: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3 text-balance">{children}</h2>,
  h2: ({ children }) => <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3 text-balance">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xl font-bold text-gray-900 mt-7 mb-3 text-balance">{children}</h3>,
  h4: ({ children }) => <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-2 text-balance">{children}</h4>,
  p: ({ children }) => <p className="text-gray-700 leading-8 mb-5 text-pretty">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-5 space-y-2 text-gray-700">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-5 space-y-2 text-gray-700">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50 px-5 py-4 my-6 text-gray-700">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    const external = /^https?:\/\//i.test(href || '')
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
      >
        {children}
      </a>
    )
  },
  strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900">{children}</th>,
  td: ({ children }) => <td className="border border-gray-200 px-3 py-2 text-gray-700">{children}</td>,
  pre: ({ children }) => <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 my-6">{children}</pre>,
  code: ({ children, className }) => className
    ? <code className={className}>{children}</code>
    : <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-900">{children}</code>,
}

export default function BlogContent({ content, className = '' }) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  )
}
