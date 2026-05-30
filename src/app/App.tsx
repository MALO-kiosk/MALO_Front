import { useCallback, useMemo, useRef, useState } from 'react'
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
import { isDesertProduct, MENU_CATALOG, type MenuProduct } from '@/data/menuCatalog'
import { saveOrder, saveStampAndGetCount } from '@/lib/orderService'
import { GREETING_MESSAGE, speak, useVoiceAI, type VoiceAIEvent, type VoiceAIStep } from '@/hooks/useVoiceAI'
import { EasyMenuSelectScreen } from '@/features/easy-menu-select'
import { EasyCustomOptionScreen } from '@/features/easy-custom-option'
import { EasyOptionScreen } from '@/features/easy-option'
import OrderConfirm2 from '@/features/home/OrderConfirm2'
import OrderComplete_alarm from '@/features/home/OrderComplete_alarm'
import OrderComplete_receipt from '@/features/home/OrderComplete_receipt'
import PaymentSelect from '@/features/home/PaymentSelect'
import StampInput from '@/features/home/StampInput'
import StampProgress from '@/features/home/StampProgress'
import { OrderFlowShell } from './OrderFlowShell'

type AppPage =
  | 'easy-menu-select'
  | 'easy-option'
  | 'easy-custom-option'
  | 'order-confirm-2'
  | 'payment'
  | 'stamp-input'
  | 'stamp'
  | 'order-complete-receipt'
  | 'order-complete-alarm'

const STEP_TO_PAGE: Partial<Record<VoiceAIStep, AppPage>> = {
  STEP2_MENU_SELECT: 'easy-menu-select',
  STEP3_OPTION_SELECT: 'easy-option',
  STEP4_CONFIRM: 'order-confirm-2',
  STEP5_PAYMENT: 'payment',
  STEP6_STAMP: 'stamp-input',
  STEP7_RECEIPT: 'order-complete-receipt',
  STEP8_COMPLETE: 'order-complete-alarm',
}

function pageToStep(p: AppPage): VoiceAIStep {
  switch (p) {
    case 'easy-menu-select': return 'STEP2_MENU_SELECT'
    case 'easy-option':
    case 'easy-custom-option': return 'STEP3_OPTION_SELECT'
    case 'order-confirm-2': return 'STEP4_CONFIRM'
    case 'payment': return 'STEP5_PAYMENT'
    case 'stamp-input':
    case 'stamp': return 'STEP6_STAMP'
    case 'order-complete-receipt': return 'STEP7_RECEIPT'
    case 'order-complete-alarm': return 'STEP8_COMPLETE'
  }
}

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
  const [started, setStarted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [page, setPage] = useState<AppPage>('easy-menu-select')
  const [aiMessage, setAiMessage] = useState(GREETING_MESSAGE)

  const displayMessage = isListening ? '듣는 중입니다...' : aiMessage

  const handleStart = () => {
    const trySpeak = () => speak(GREETING_MESSAGE)
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', trySpeak, { once: true })
    }
    setStarted(true)
  }

  const currentOrderId = useRef<string | null>(null)
  const [stampCount, setStampCount] = useState(0)

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

  const cartSummary = useMemo(
    () =>
      easyCartDrafts.length === 0
        ? '(비어있음)'
        : easyCartDrafts.map((d) => `${d.name} x${d.quantity}`).join(', '),
    [easyCartDrafts],
  )

  const customOptionReturnPage = useRef<
    Extract<AppPage, 'easy-menu-select' | 'easy-option'>
  >('easy-menu-select')

  const goHome = useCallback(() => {
    setEasyCartDrafts([])
    currentOrderId.current = null
    setAiMessage(GREETING_MESSAGE)
    setPage('easy-menu-select')
  }, [])

  const callStaff = useCallback(() => {
    alert('직원을 호출했습니다.\n잠시만 기다려 주세요.')
  }, [])

  const handlePaymentDone = useCallback(async () => {
    const orderId = await saveOrder('dine_in', easyCartDrafts)
    currentOrderId.current = orderId
    setPage('stamp-input')
  }, [easyCartDrafts])

  const handleStampSubmit = useCallback(async (phoneNumber: string) => {
    const orderId = currentOrderId.current
    if (!orderId) { setPage('stamp'); return }
    const count = await saveStampAndGetCount(orderId, phoneNumber)
    setStampCount(count)
    setPage('stamp')
  }, [])

  const handleVoiceEvent = useCallback(
    (event: VoiceAIEvent) => {
      setAiMessage(event.aiResponse)

      let skipNextStepNav = false

      if (event.action) {
        switch (event.action.type) {
          case 'ADD_CART': {
            const menuName = String(event.action.payload.menuName ?? '')
            const count = Number(event.action.payload.count ?? 1)
            const cleanName = (s: string) => s.replace(/\s/g, '')
            const product = MENU_CATALOG.find(
              (p) =>
                p.name === menuName ||
                cleanName(p.name) === cleanName(menuName) ||
                p.name.includes(menuName) ||
                menuName.includes(p.name),
            )
            if (product) {
              const draft = { ...orderLineFromProduct(product), quantity: count }
              if (isDesertProduct(product)) {
                addToEasyCart(draft)
                skipNextStepNav = true
              } else {
                setEasyOrderLine(draft)
                // nextStep STEP3_OPTION_SELECT handles navigation to easy-option
              }
            }
            break
          }
          case 'SELECT_OPTION': {
            const { temp, size } = event.action.payload
            if (temp === 'ice' || temp === 'hot') patchEasyOrderLine({ temp })
            if (size === 'regular' || size === 'large') patchEasyOrderLine({ size })
            break
          }
          case 'CONFIRM_ORDER':
            // navigation handled by nextStep
            break
          case 'SET_PAYMENT':
            handlePaymentDone()
            skipNextStepNav = true
            break
          case 'SET_STAMP': {
            const { earn, phone } = event.action.payload
            if (earn && phone) {
              handleStampSubmit(String(phone))
            } else {
              setPage('order-complete-receipt')
            }
            skipNextStepNav = true
            break
          }
          case 'SET_RECEIPT':
            setPage('order-complete-alarm')
            skipNextStepNav = true
            break
        }
      }

      if (!skipNextStepNav && event.nextStep) {
        const nextPage = STEP_TO_PAGE[event.nextStep]
        if (nextPage) setPage(nextPage)
      }
    },
    [addToEasyCart, handlePaymentDone, handleStampSubmit, patchEasyOrderLine],
  )

  useVoiceAI({
    currentStep: pageToStep(page),
    cartSummary,
    onEvent: handleVoiceEvent,
    onListeningChange: setIsListening,
  })

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

  const renderPage = () => {
    switch (page) {
      case 'easy-menu-select':
        return (
          <EasyMenuSelectScreen
            onGoHome={goHome}
            onStaffCall={callStaff}
            cartItems={easyCartItems}
            aiMessage={displayMessage}
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
            aiMessage={displayMessage}
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
            aiMessage={displayMessage}
            onCancelOrder={() => setPage(customOptionReturnPage.current)}
            onAddMenu={() => {
              addToEasyCart(easyOrderLine)
              setPage('easy-menu-select')
            }}
          />
        )

      case 'order-confirm-2':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <OrderConfirm2
              lines={easyCartDrafts.map(enrichOrderLineFromCatalog)}
              onPrev={() => setPage('easy-menu-select')}
              onNext={() => setPage('payment')}
            />
          </OrderFlowShell>
        )

      case 'payment':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <PaymentSelect
              onNext={handlePaymentDone}
              onPrev={() => setPage('order-confirm-2')}
            />
          </OrderFlowShell>
        )

      case 'stamp-input':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <StampInput
              onNext={handleStampSubmit}
              onSkip={() => setPage('order-complete-receipt')}
            />
          </OrderFlowShell>
        )

      case 'stamp':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <StampProgress
              currentCount={stampCount}
              totalCount={10}
              onNext={() => setPage('order-complete-receipt')}
            />
          </OrderFlowShell>
        )

      case 'order-complete-receipt':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <OrderComplete_receipt
              onNext={() => setPage('order-complete-alarm')}
            />
          </OrderFlowShell>
        )

      case 'order-complete-alarm':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <OrderComplete_alarm onHome={goHome} />
          </OrderFlowShell>
        )

      default:
        return null
    }
  }

  return (
    <StageViewport>
      <div style={{ position: 'relative', width: STAGE_WIDTH, height: STAGE_HEIGHT, flexShrink: 0 }}>
        <div key={page} style={stagePageStyle}>
          {renderPage()}
        </div>
        {!started && (
          <div
            onClick={handleStart}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
              zIndex: 9999,
              gap: 24,
            }}
          >
            <p style={{ color: '#fff', fontSize: 52, fontWeight: 700, margin: 0 }}>MALO</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 28, margin: 0 }}>
              화면을 터치해 주세요
            </p>
          </div>
        )}
      </div>
    </StageViewport>
  )
}