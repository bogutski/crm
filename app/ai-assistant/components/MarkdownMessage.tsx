'use client';

import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1">{children}</ol>
  ),
  li: ({ children }) => (
    <li>{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold mb-3 last:mb-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold mb-3 last:mb-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-2 last:mb-0">{children}</h3>
  ),
  code: ({ className, children }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-[0.875em]">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-black/5 dark:bg-white/5 p-3 rounded-lg overflow-x-auto mb-3 last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3 last:mb-0">
      <table className="min-w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-black/5 dark:bg-white/5">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-300 dark:border-zinc-600 px-3 py-2">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic mb-3 last:mb-0">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 hover:underline"
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="border-zinc-300 dark:border-zinc-600 my-3" />
  ),
};

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
