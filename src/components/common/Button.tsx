import type { ReactNode } from 'react'
import '../../styles/Button.css'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: string
  className?: string
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`base-btn ${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
