'use client'

import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

type Props = {
  markdown: string
  className?: string
}

/** Encabezados MD solo como vista previa: nivel 6 para no competir con el outline del simulador (WCAG 2.4.10). */
function MdPreviewHeading({
  visualClassName,
  children,
}: {
  visualClassName: string
  children?: React.ReactNode
}) {
  return (
    <div role="heading" aria-level={6} className={visualClassName}>
      {children}
    </div>
  )
}

const previewComponents: Components = {
  h1: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-2 font-serif text-[18px] text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
  h2: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-2 mt-4 font-serif text-[15px] text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
  h3: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-1 mt-3 text-[13px] font-semibold text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
  h4: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-1 mt-2 text-[12px] font-semibold text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
  h5: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-1 mt-2 text-[12px] font-semibold text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
  h6: ({ children }) => (
    <MdPreviewHeading visualClassName="mb-1 mt-2 text-[11px] font-semibold text-[#1C1B18]">{children}</MdPreviewHeading>
  ),
}

const previewProseClasses =
  'max-h-[min(420px,50vh)] overflow-auto rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 text-[12px] leading-relaxed text-[#1C1B18] [&_blockquote]:border-l-2 [&_blockquote]:border-[#D4881E]/40 [&_blockquote]:pl-3 [&_blockquote]:text-[#5C5740] [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[#1C1B08]/5 [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-[11px] [&_ul]:list-disc'

/**
 * Preview Markdown del Auditor: HTML vía react-markdown + rehype-sanitize (sin raw HTML arbitrario).
 * No usar dangerouslySetInnerHTML con el string fuente.
 */
export function SocialContextMarkdownPreview({ markdown, className }: Props) {
  return (
    <div data-testid="social-pr5-md-preview" className={className ?? previewProseClasses}>
      <ReactMarkdown components={previewComponents} rehypePlugins={[rehypeSanitize]}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
