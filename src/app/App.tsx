import { useCallback, useRef, useState } from 'react'
import '@/lib/useMenuCatalog'
import { StageViewport } from '@/components/layout'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/config/stage'
import type { EasyCartLineItem } from '@/components/common'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import {
  createDefaultOrderLineDraft,
  enrichOrderLineFromCatalog,
  orderLineDraftToCartItem,
  orderLineFromProduct,
} from '@/lib/orderLineDraft'
import { isDesertProduct, type MenuProduct } from '@/data/menuCatalog'
import { saveOrder, saveStampAndGetCount, type PlaceType } from '@/lib/orderService'
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

function mergeIntoDrafts(
  prev: OrderLineDraft[],
  draft: OrderLineDraft,
): OrderLineDraft[] {
  const i = prev.findIndex((x) => x.id === draft.id)
  if (i === -1) return [...prev, draft]
  const next = [...prev]
  next[i] = { ...next[i]!, quantity: next[i]!.quantity + draft.quantity }
  return next
}

export default function App() {
  const [page, setPage] = useState<AppPage>('home')

  // ── 주문 관련 상태 ──────────────────────────────────────────────────────
  const [placeType, setPlaceType] = useState<PlaceType>('dine_in')
  const currentOrderId = useRef<string | null>(null)
  const [stampCount, setStampCount] = useState(0)

  // ── 쉬운 모드 ──────────────────────────────────────────────────────────
  const [easyOrderLine, setEasyOrderLine] = useState<OrderLineDraft>(
    createDefaultOrderLineDraft,
  )
  const [easyCartDrafts, setEasyCartDrafts] = useState<OrderLineDraft[]>([])

  const patchEasyOrderLine = useCallback((patch: Partial<OrderLineDraft>) => {
    setEasyOrderLine((prev) => ({ ...prev, ...patch }))
  }, [])

  const addToEasyCart = useCallback((draft: OrderLineDraft) => {
    setEasyCartDrafts((prev) => mergeIntoDrafts(prev, draft))
  }, [])

  const easyCartItems: EasyCartLineItem[] = easyCartDrafts.map(orderLineDraftToCartItem)

  // ── 일반 모드 ──────────────────────────────────────────────────────────
  const [commonOrderLine, setCommonOrderLine] = useState<OrderLineDraft>(
    createDefaultOrderLineDraft,
  )
  const [commonCartDrafts, setCommonCartDrafts] = useState<OrderLineDraft[]>([])

  const patchCommonOrderLine = useCallback((patch: Partial<OrderLineDraft>) => {
    setCommonOrderLine((prev) => ({ ...prev, ...patch }))
  }, [])

  const addToCommonCart = useCallback((draft: OrderLineDraft) => {
    setCommonCartDrafts((prev) => mergeIntoDrafts(prev, draft))
  }, [])

  const commonCartLines: EasyCartLineItem[] = commonCartDrafts.map(orderLineDraftToCartItem)

  // ── 공통 ref ───────────────────────────────────────────────────────────
  const orderConfirmSource = useRef<OrderConfirmPage>('order-confirm-2')
  const customOptionReturnPage = useRef<
    Extract<AppPage, 'easy-menu-select' | 'easy-option' | 'common-option'>
  >('easy-menu-select')

  // ── 내비게이션 ─────────────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setEasyCartDrafts([])
    setCommonCartDrafts([])
    currentOrderId.current = null
    setPage('home')
  }, [])

  const callStaff = useCallback(() => {
    alert('직원을 호출했습니다.\n잠시만 기다려 주세요.')
  }, [])

  // 결제 완료 → 주문 DB 저장 후 stamp-input으로 이동
  const handlePaymentDone = useCallback(async () => {
    const lines =
      orderConfirmSource.current === 'order-confirm-2'
        ? easyCartDrafts
        : commonCartDrafts
    const orderId = await saveOrder(placeType, lines)
    currentOrderId.current = orderId
    setPage('stamp-input')
  }, [placeType, easyCartDrafts, commonCartDrafts])

  // 스탬프 적립 → DB upsert 후 stamp 화면으로
  const handleStampSubmit = useCallback(async (phoneNumber: string) => {
    const orderId = currentOrderId.current
    if (!orderId) { setPage('stamp'); return }
    const count = await saveStampAndGetCount(orderId, phoneNumber)
    setStampCount(count)
    setPage('stamp')
  }, [])

  // ── 상품 선택 처리 ─────────────────────────────────────────────────────
  const handleEasySelectProduct = useCallback(
    (product: MenuProduct) => {
      if (isDesertProduct(product)) {
        addToEasyCart(orderLineFromProduct(product))
      } else {
        setEasyOrderLine(orderLineFromProduct(product))
        setPage('easy-option')
      }
    },
    [addToEasyCart],
  )

  const handleCommonSelectProduct = useCallback(
    (product: MenuProduct) => {
      if (isDesertProduct(product)) {
        addToCommonCart(orderLineFromProduct(product))
      } else {
        setCommonOrderLine(orderLineFromProduct(product))
        setPage('common-option')
      }
    },
    [addToCommonCart],
  )

  // ── 렌더 ───────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomeScreen
            onPlaceTypeSelected={(type) => {
              setPlaceType(type)
              setPage('mode-select')
            }}
          />
        )

      case 'mode-select':
        return (
          <ModeSelectScreen
            onGoHome={goHome}
            onSelectEasy={() => setPage('easy-menu-select')}
            onSelectNormal={() => setPage('common-menu-select')}
          />
        )

      // ── 쉬운 모드 ────────────────────────────────────────────────────
      case 'easy-menu-select':
        return (
          <EasyMenuSelectScreen
            onGoHome={goHome}
            onStaffCall={callStaff}
            cartItems={easyCartItems}
            onIncrementCart={(id) =>
              setEasyCartDrafts((prev) =>
                prev.map((x) =>
                  x.id === id ? { ...x, quantity: x.quantity + 1 } : x,
                ),
              )
            }
            onDecrementCart={(id) =>
              setEasyCartDrafts((prev) =>
                prev.flatMap((x) => {
                  if (x.id !== id) return [x]
                  if (x.quantity <= 1) return []
                  return [{ ...x, quantity: x.quantity - 1 }]
                }),
              )
            }
            onRemoveFromCart={(id) =>
              setEasyCartDrafts((prev) => prev.filter((x) => x.id !== id))
            }
            onSelectProduct={handleEasySelectProduct}
            onOrder={() => {
              if (easyCartDrafts.length === 0) return
              orderConfirmSource.current = 'order-confirm-2'
              setPage('order-confirm-2')
            }}
          />
        )

      case 'easy-option':
        return (
          <EasyOptionScreen
            orderLine={easyOrderLine}
            onOrderLineChange={patchEasyOrderLine}
            onGoHome={goHome}
            onStaffCall={callStaff}
            onCancelOrder={() => setPage('easy-menu-select')}
            onAddMenu={() => {
              addToEasyCart(easyOrderLine)
              setPage('easy-menu-select')
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
            onStaffCall={callStaff}
            onCancelOrder={() => setPage(customOptionReturnPage.current)}
            onAddMenu={() => {
              addToEasyCart(easyOrderLine)
              setPage('easy-menu-select')
            }}
          />
        )

      case 'order-confirm-2':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderConfirm2
              lines={easyCartDrafts.map(enrichOrderLineFromCatalog)}
              onPrev={() => setPage('easy-menu-select')}
              onNext={() => {
                orderConfirmSource.current = 'order-confirm-2'
                setPage('payment')
              }}
            />
          </OrderFlowShell>
        )

      // ── 일반 모드 ────────────────────────────────────────────────────
      case 'common-menu-select':
        return (
          <CommonMenuSelectScreen
            onGoHome={goHome}
            onStaffCall={callStaff}
            cartLines={commonCartLines}
            onIncrementCart={(id) =>
              setCommonCartDrafts((prev) =>
                prev.map((x) =>
                  x.id === id ? { ...x, quantity: x.quantity + 1 } : x,
                ),
              )
            }
            onDecrementCart={(id) =>
              setCommonCartDrafts((prev) =>
                prev.flatMap((x) => {
                  if (x.id !== id) return [x]
                  if (x.quantity <= 1) return []
                  return [{ ...x, quantity: x.quantity - 1 }]
                }),
              )
            }
            onRemoveFromCart={(id) =>
              setCommonCartDrafts((prev) => prev.filter((x) => x.id !== id))
            }
            onSelectProduct={handleCommonSelectProduct}
            onOrder={() => {
              if (commonCartDrafts.length === 0) return
              orderConfirmSource.current = 'order-confirm'
              setPage('order-confirm')
            }}
          />
        )

      case 'common-option':
        return (
          <CommonOptionScreen
            orderLine={commonOrderLine}
            onOrderLineChange={patchCommonOrderLine}
            onGoHome={goHome}
            onStaffCall={callStaff}
            onCancelOrder={() => setPage('common-menu-select')}
            onAddMenu={() => {
              addToCommonCart(commonOrderLine)
              setPage('common-menu-select')
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
              addToCommonCart(commonOrderLine)
              setPage('common-menu-select')
            }}
          />
        )

      case 'order-confirm':
        return (
          <OrderFlowShell onHome={goHome}>
            <OrderConfirm
              lines={commonCartDrafts.map(enrichOrderLineFromCatalog)}
              onPrev={() => setPage('common-menu-select')}
              onNext={() => {
                orderConfirmSource.current = 'order-confirm'
                setPage('payment')
              }}
            />
          </OrderFlowShell>
        )

      // ── 결제·적립·완료 ────────────────────────────────────────────────
      case 'payment':
        return (
          <OrderFlowShell onHome={goHome}>
            <PaymentSelect
              onNext={handlePaymentDone}
              onPrev={() => setPage(orderConfirmSource.current)}
            />
          </OrderFlowShell>
        )

      case 'stamp-input':
        return (
          <OrderFlowShell onHome={goHome}>
            <StampInput
              onNext={handleStampSubmit}
              onSkip={() => setPage('order-complete-receipt')}
            />
          </OrderFlowShell>
        )

      case 'stamp':
        return (
          <OrderFlowShell onHome={goHome}>
            <StampProgress
              currentCount={stampCount}
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
//배포테스트