import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--c-ember)] text-white hover:bg-[var(--c-ember-hi)] focus-visible:ring-[var(--c-ember)]':
              variant === 'primary',
            'bg-[var(--c-card)] text-[var(--c-ink)] border border-[var(--c-line)] hover:bg-[var(--c-line-soft)] focus-visible:ring-[var(--c-ink)]':
              variant === 'secondary',
            'border border-[var(--c-ember)] text-[var(--c-ember)] hover:bg-[var(--c-ember-bg)] focus-visible:ring-[var(--c-ember)]':
              variant === 'outline',
          },
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
