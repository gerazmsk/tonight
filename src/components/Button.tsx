import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-tonight-accent text-white hover:bg-tonight-accent-hover active:scale-[0.98] shadow-lg shadow-tonight-accent/20',
  secondary:
    'bg-tonight-card text-white border border-tonight-border hover:bg-tonight-border/40 active:scale-[0.98]',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]',
  ghost:
    'bg-transparent text-tonight-muted hover:text-white hover:bg-tonight-card/50',
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3',
        'text-sm font-semibold leading-none transition-all',
        'disabled:pointer-events-none disabled:opacity-50',
        'touch-manipulation select-none',
        variants[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
