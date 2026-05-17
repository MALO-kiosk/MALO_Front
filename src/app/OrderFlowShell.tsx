import type { PropsWithChildren } from 'react'
import Header from '@/components/common/Header'

export type OrderFlowShellProps = PropsWithChildren<{
  onHome?: () => void
}>

/** feature/soyoung 결제·적립 플로우 공통 래퍼 (Header + 1080×1920 스테이지) */
export function OrderFlowShell({ children, onHome }: OrderFlowShellProps) {
  return (
    <div className="order-confirm-stage">
      <Header onHome={onHome} />
      {children}
    </div>
  )
}
