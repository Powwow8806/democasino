import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'accent'

const styles: Record<Variant, string> = {
  primary: 'bg-nv-cyan text-black hover:bg-cyan-300 font-semibold',
  secondary: 'bg-nv-card border border-nv-border text-nv-text hover:bg-nv-border/40',
  danger: 'bg-nv-red text-white hover:bg-rose-400 font-semibold',
  success: 'bg-nv-green text-black hover:bg-emerald-300 font-semibold',
  ghost: 'bg-transparent text-nv-muted hover:text-nv-text hover:bg-white/5',
  accent: 'bg-nv-purple text-white hover:bg-purple-400 font-semibold',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
  full?: boolean
}

export function Button({ variant = 'secondary', children, full, className = '', disabled, ...rest }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`touch-target inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
