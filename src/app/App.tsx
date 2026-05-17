import { useCallback, useRef, useState } from 'react'
import { StageViewport } from '@/components/layout'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/config/stage'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import {
  createDefaultOrderLineDraft,
  orderLineFromCartItem,
} from '@/lib/orderLineDraft'
import { CommonOptionScreen } from '@/features/common-option'
import { CommonMenuSelectScreen } from '@/features/common-menu-select'
import { EasyMenuSelectScreen } from '@/features/easy-menu-select'
import { CommonCustomOptionScreen } from '@/features/common-custom-option'
import { EasyCustomOptionScreen } from '@/features/easy-custom-option'
import { EasyOptionScreen } from '@/features/easy-option'
import OrderConfirm from '@/features/home/OrderConfirm'
import OrderConfirm2 from '@/features/home/OrderConfirm2'
import OrderComplete_alarm from '@/features/home/OrderComplete_alarm'
import OrderComplete_receipt from '@/features/home/OrderComplete_receipt'
import PaymentSelect from '@/features/home/PaymentSelect'
import StampInput from '@/features/home/StampInput'
import StampProgress from '@/features/home/StampProgress'
import { HomeScreen } from '@/features/home'
import { ModeSelectScreen } from '@/features/mode-select'
import { OrderFlowShell } from './OrderFlowShell'

type AppPage =
  | 'home'
  | 'mode-select'
  | 'easy-menu-select'
  | 'easy-option'
  | 'easy-custom-option'
  | 'order-confirm-2'
  | 'payment'
  | 'stamp-input'
  | 'stamp'
  | 'order-complete-receipt'
  | 'order-complete-alarm'
  | 'common-menu-select'
  | 'common-option'
  | 'common-custom-option'
  | 'order-confirm'

type OrderConfirmPage = 'order-confirm' | 'order-confirm-2'

const stagePageStyle = {
  position: 'relative' as const,
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  flexShrink: 0,
}

export default function App() {
  const [page, setPage] = useState<AppPage>('home')
  /** 맞춤 옵션 화면에서 주문취소 시 복귀 경로 */
  const customOptionReturnPage = useRef<
    Extract<AppPage, 'easy-menu-select' | 'easy-option' | 'common-option'>
  >('easy-menu-select')
  const [easyOrderLine, setEasyOrderLine] = useState<OrderLineDraft>(
    createDefaultOrderLineDraft,
  )
  const [commonOrderLine, setCommonOrderLine] = useState<OrderLineDraft>(
    createDefaultOrderLineDraft,
  )

  const patchEasyOrderLine = useCallback((patch: Partial<OrderLineDraft>) => {
    setEasyOrderLine((prev) => ({ ...prev, ...patch }))
  }, [])

  const patchCommonOrderLine = useCallback((patch: Partial<OrderLineDraft>) => {
    setCommonOrderLine((prev) => ({ ...prev, ...patch }))
  }, [])
  /** 결제 화면 이전 → 어느 주문 확인으로 돌아갈지 */
  const orderConfirmSource = useRef<OrderConfirmPage>('order-confirm-2')
  /** 주문 확인 이전 → 옵션 또는 맞춤 옵션 */
  const easyOrderConfirmPrev = useRef<
    Extract<AppPage, 'easy-option' | 'easy-custom-option'>
  >('easy-option')
  const commonOrderConfirmPrev = useRef<
    Extract<AppPage, 'common-option' | 'common-custom-option'>
  >('common-option')

  const goHome = useCallback(() => setPage('home'), [])

  const goEasyOrderConfirm = useCallback(() => {
    orderConfirmSource.current = 'order-confirm-2'
    setPage('order-confirm-2')
  }, [])

  const goCommonOrderConfirm = useCallback(() => {
    orderConfirmSource.current = 'order-confirm'
    setPage('order-confirm')
  }, [])

  const goPayment = useCallback(() => setPage('payment'), [])

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomeScreen onPlaceTypeSelected={() => setPage('mode-select')} />
        )
      case 'mode-select':
        return (
          <ModeSelectScreen
            onGoHome={goHome}
            onSelectEasy={() => setPage('easy-menu-select')}
            onSelectNormal={() => setPage('common-menu-select')}
          />
        )
      case 'easy-menu-select':
        return (
          <EasyMenuSelectScreen
            onGoHome={goHome}
            onOrder={(items) => {
              const last = items[items.length - 1]
              if (last) setEasyOrderLine(orderLineFromCartItem(last))
              setPage('easy-option')
            }}
          />
        )
      case 'easy-option':
        return (
          <EasyOptionScreen
            orderLine={easyOrderLine}
            onOrderLineChange={patchEasyOrderLine}
            onGoHome={goHome}
            onCancelOrder={() => setPage('easy-menu-select')}
            onAddMenu={() => {
              easyOrderConfirmPrev.current = 'easy-option'
              goEasyOrderConfirm()
            }}
            onOpenCustomOption={() => {
              customOptionReturnPage.current = 'easy-option'
              setPage('easy-custom-option')
            }}
          />
        )
      case 'easy-custom-option':
        return (
          <EasyCustomOptionScreen
            orderLine={easyOrderLine}
            onOrderLineChange={patchEasyOrderLine}
            onGoHome={goHome}
            onCancelOrder={() => setPage(customOptionReturnPage.current)}
            onAddMenu={() => {
              easyOrderConfirmPrev.current = 'easy-custom-option'
              goEasyOrderConfirm()
            }}
          />
        )
      case 'order-confirm-2':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderConfirm2
              line={easyOrderLine}
              onPrev={() => setPage(easyOrderConfirmPrev.current)}
              onNext={goPayment}
            />
          </OrderFlowShell>
        )
      case 'common-menu-select':
        return (
          <CommonMenuSelectScreen
            onGoHome={goHome}
            onOrder={(line) => {
              setCommonOrderLine(orderLineFromCartItem(line))
              setPage('common-option')
            }}
          />
        )
      case 'common-option':
        return (
          <CommonOptionScreen
            orderLine={commonOrderLine}
            onOrderLineChange={patchCommonOrderLine}
            onGoHome={goHome}
            onCancelOrder={() => setPage('common-menu-select')}
            onAddMenu={() => {
              commonOrderConfirmPrev.current = 'common-option'
              goCommonOrderConfirm()
            }}
            onOpenCustomOption={() => setPage('common-custom-option')}
          />
        )
      case 'common-custom-option':
        return (
          <CommonCustomOptionScreen
            orderLine={commonOrderLine}
            onOrderLineChange={patchCommonOrderLine}
            onGoHome={goHome}
            onCancelOrder={() => setPage('common-option')}
            onAddMenu={() => {
              commonOrderConfirmPrev.current = 'common-custom-option'
              goCommonOrderConfirm()
            }}
          />
        )
      case 'order-confirm':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderConfirm
              line={commonOrderLine}
              onPrev={() => setPage(commonOrderConfirmPrev.current)}
              onNext={goPayment}
            />
          </OrderFlowShell>
        )
      case 'payment':
        return (
          <OrderFlowShell onHome={goHome}>
            <PaymentSelect
              onNext={() => setPage('stamp-input')}
              onPrev={() => setPage(orderConfirmSource.current)}
            />
          </OrderFlowShell>
        )
      case 'stamp-input':
        return (
          <OrderFlowShell onHome={goHome}>
            <StampInput onNext={() => setPage('stamp')} />
          </OrderFlowShell>
        )
      case 'stamp':
        return (
          <OrderFlowShell onHome={goHome}>
            <StampProgress
              currentCount={5}
              totalCount={10}
              onNext={() => setPage('order-complete-receipt')}
            />
          </OrderFlowShell>
        )
      case 'order-complete-receipt':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderComplete_receipt
              onNext={() => setPage('order-complete-alarm')}
            />
          </OrderFlowShell>
        )
      case 'order-complete-alarm':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderComplete_alarm onHome={goHome} />
          </OrderFlowShell>
        )
      default:
        return null
    }
  }

  return (
    <StageViewport>
      <div key={page} style={stagePageStyle}>
        {renderPage()}
      </div>
    </StageViewport>
  )
}
