import type { PropsWithChildren } from 'react'
import Header from '@/components/common/Header'
import { AISpeechDisplay } from '@/components/common/AISpeechDisplay'

export type OrderFlowShellProps = PropsWithChildren<{
  onHome?: () => void
  onStaffCall?: () => void
  aiMessage?: string
}>

/** feature/soyoung 결제·적립 플로우 공통 래퍼 (Header + 1080×1920 스테이지) */
export function OrderFlowShell({ children, onHome, onStaffCall, aiMessage }: OrderFlowShellProps) {
  return (
    <div className="order-confirm-stage">
      <Header onHome={onHome} onStaffCall={onStaffCall} />
      {children}
      {aiMessage && (
        <AISpeechDisplay
          message={aiMessage}
          listening
          style={{ bottom: '30px', right: '26px' }}
        />
      )}
    </div>
  )
}
