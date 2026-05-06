import type { ReactNode } from 'react'

export function SectionHeader({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string
  title: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </div>
  )
}
