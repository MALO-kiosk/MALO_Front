import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMenuCatalog } from '@/lib/useMenuCatalog'
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
import { saveOrder, saveStampAndGetCount, type PlaceType } from '@/lib/orderService'
import { GREETING_MESSAGE, speak, useVoiceAI, type VoiceAIEvent, type VoiceAIStep } from '@/hooks/useVoiceAI'
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
import { BannerAdminPage } from '@/features/admin/BannerAdminPage'
import { OrderFlowShell } from './OrderFlowShell'

type AppPage =
  | 'home'
  | 'admin'
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

// 쉬운모드 step ↔ page 매핑
const STEP_TO_PAGE: Partial<Record<VoiceAIStep, AppPage>> = {
  STEP2_MENU_SELECT: 'easy-menu-select',
  STEP3_OPTION_SELECT: 'easy-option',
  STEP4_CONFIRM: 'order-confirm-2',
  STEP5_PAYMENT: 'payment',
  STEP6_STAMP: 'stamp-input',
  STEP7_RECEIPT: 'order-complete-receipt',
  STEP8_COMPLETE: 'order-complete-alarm',
}

// 비쉬운모드 페이지는 STEP1_GREETING 반환 → 음성 AI 비활성
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
    default: return 'STEP1_GREETING'
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
  // ── 우클릭 컨텍스트 메뉴 전역 비활성화 ────────────────────────────────
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', disableContextMenu)
    return () => document.removeEventListener('contextmenu', disableContextMenu)
  }, [])

  // ── Supabase 메뉴 카탈로그 (음성 주문 기준 데이터) ─────────────────────
  const { products: liveMenuProducts } = useMenuCatalog()
  const liveMenuProductsRef = useRef<MenuProduct[]>(liveMenuProducts)
  liveMenuProductsRef.current = liveMenuProducts

  // ── 페이지 상태 (develop 유지: 초기값 'home') ──────────────────────────
  const isAdminUrl = new URLSearchParams(window.location.search).has('admin')
  const [page, setPage] = useState<AppPage>(isAdminUrl ? 'admin' : 'home')
  const pageRef = useRef<AppPage>('home')
  pageRef.current = page

  // ── 쉬운모드 음성 AI 상태 ──────────────────────────────────────────────
  const [isEasyMode, setIsEasyMode] = useState(false)
  const [_isListening, setIsListening] = useState(false)
  const [aiMessage, setAiMessage] = useState(GREETING_MESSAGE)
  const [currentTranscript, setCurrentTranscript] = useState('')
  // 쉬운모드일 때만 AI 말풍선 표시 — 사용자가 말하는 중이면 실시간 발화 우선
  const displayMessage = isEasyMode ? (currentTranscript || aiMessage) : undefined

  // 인사말 반복 루프 제어
  const greetingActiveRef = useRef(false)
  const greetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopGreetingLoop = useCallback(() => {
    greetingActiveRef.current = false
    if (greetingTimerRef.current !== null) {
      clearTimeout(greetingTimerRef.current)
      greetingTimerRef.current = null
    }
  }, [])

  // ── 주문 관련 상태 ──────────────────────────────────────────────────────
  const [placeType, setPlaceType] = useState<PlaceType>('dine_in')
  const currentOrderId = useRef<string | null>(null)
  const [stampCount, setStampCount] = useState(0)

  // ── 쉬운 모드 ──────────────────────────────────────────────────────────
  const [easyOrderLine, setEasyOrderLine] = useState<OrderLineDraft>(
    createDefaultOrderLineDraft,
  )
  const easyOrderLineRef = useRef(easyOrderLine)
  easyOrderLineRef.current = easyOrderLine

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
  // 물리 홈 버튼: 'home' 으로 이동 (develop 유지)
  const goHome = useCallback(() => {
    setEasyCartDrafts([])
    setCommonCartDrafts([])
    currentOrderId.current = null
    setPage('home')
  }, [])

  const callStaff = useCallback(() => {
    alert('직원을 호출했습니다.\n잠시만 기다려 주세요.')
  }, [])

  // 쉬운모드 진입: 인사말 루프 시작 + easy-menu-select 이동
  const handleSelectEasy = useCallback(() => {
    setIsEasyMode(true)
    setPage('easy-menu-select')
    greetingActiveRef.current = true

    const playGreeting = () => {
      if (!greetingActiveRef.current) return
      speak(GREETING_MESSAGE, () => {
        if (!greetingActiveRef.current) return
        greetingTimerRef.current = setTimeout(playGreeting, 3000)
      })
    }

    if (window.speechSynthesis.getVoices().length > 0) {
      playGreeting()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', playGreeting, { once: true })
    }
  }, [])

  // 결제 완료 → 주문 DB 저장 후 stamp-input으로 이동 (develop 유지: placeType + orderConfirmSource)
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

  // ── 쉬운모드 음성 이벤트 핸들러 ───────────────────────────────────────
  const handleVoiceEvent = useCallback(
    (event: VoiceAIEvent) => {
      stopGreetingLoop()
      setAiMessage(event.aiResponse)

      let skipNextStepNav = false

      if (event.action) {
        switch (event.action.type) {
          case 'CALL_STAFF':
            callStaff()
            skipNextStepNav = true
            break
          case 'GO_HOME':
            // 음성 "주문취소/나가기": easy-menu-select로 이동 (충돌2 B)
            setEasyCartDrafts([])
            currentOrderId.current = null
            setAiMessage(GREETING_MESSAGE)
            setPage('easy-menu-select')
            skipNextStepNav = true
            break
          case 'GO_BACK': {
            const prevPageMap: Partial<Record<AppPage, AppPage>> = {
              'easy-option': 'easy-menu-select',
              'easy-custom-option': customOptionReturnPage.current,
              'order-confirm-2': 'easy-menu-select',
              payment: 'order-confirm-2',
              'stamp-input': 'payment',
              'order-complete-receipt': 'stamp-input',
            }
            const prev = prevPageMap[pageRef.current]
            if (prev) setPage(prev)
            else setPage('easy-menu-select')
            skipNextStepNav = true
            break
          }
          case 'ADD_CART': {
            const menuName = String(event.action.payload.menuName ?? '')
            const count = Number(event.action.payload.count ?? 1)
            const cleanName = (s: string) => s.replace(/\s/g, '')
            const catalog = liveMenuProductsRef.current.length > 0 ? liveMenuProductsRef.current : MENU_CATALOG
            const product = catalog.find(
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
          case 'SELECT_CUP': {
            const { cup } = event.action.payload
            if (cup === 'mug' || cup === 'personal') patchEasyOrderLine({ cup })
            break
          }
          case 'OPEN_CUSTOM_OPTION': {
            customOptionReturnPage.current = pageRef.current === 'easy-option' ? 'easy-option' : 'easy-menu-select'
            setPage('easy-custom-option')
            skipNextStepNav = true
            break
          }
          case 'ADD_LINE_TO_CART': {
            addToEasyCart(easyOrderLineRef.current)
            if (!event.nextStep) {
              setPage('easy-menu-select')
              skipNextStepNav = true
            }
            break
          }
          case 'SET_SHOT': {
            const delta = Number(event.action.payload.delta ?? 0)
            setEasyOrderLine((prev) => ({ ...prev, shotQty: Math.max(0, prev.shotQty + delta) }))
            break
          }
          case 'SET_SYRUP': {
            const delta = Number(event.action.payload.delta ?? 0)
            setEasyOrderLine((prev) => ({ ...prev, syrupQty: Math.max(0, prev.syrupQty + delta) }))
            break
          }
          case 'SET_SWEETNESS': {
            const { sweetness } = event.action.payload
            if (sweetness === 'more' || sweetness === 'normal' || sweetness === 'less') {
              patchEasyOrderLine({ sweetness })
            }
            break
          }
          case 'SET_PEARL': {
            const pearlIndex = Number(event.action.payload.pearlIndex ?? 0)
            const delta = Number(event.action.payload.delta ?? 0)
            if (pearlIndex >= 0 && pearlIndex <= 2) {
              setEasyOrderLine((prev) => {
                const next = [...prev.pearlQtys] as [number, number, number]
                next[pearlIndex] = Math.max(0, next[pearlIndex] + delta)
                return { ...prev, pearlQtys: next }
              })
            }
            break
          }
          case 'CONFIRM_ORDER':
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
    [addToEasyCart, goHome, handlePaymentDone, handleStampSubmit, patchEasyOrderLine, stopGreetingLoop],
  )

  // 비쉬운모드 페이지에서는 STEP1_GREETING 반환 → 음성 AI 비활성 (충돌3 B)
  useVoiceAI({
    currentStep: pageToStep(page),
    cartSummary,
    menuProducts: liveMenuProducts,
    onEvent: handleVoiceEvent,
    onListeningChange: setIsListening,
    onTranscriptChange: setCurrentTranscript,
  })

  // ── 상품 선택 처리 ─────────────────────────────────────────────────────
  const handleEasySelectProduct = useCallback(
    (product: MenuProduct) => {
      stopGreetingLoop()
      window.speechSynthesis.cancel()
      if (isDesertProduct(product)) {
        addToEasyCart(orderLineFromProduct(product))
      } else {
        setEasyOrderLine(orderLineFromProduct(product))
        setPage('easy-option')
      }
    },
    [addToEasyCart, stopGreetingLoop],
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
            onStaffCall={callStaff}
          />
        )

      case 'mode-select':
        return (
          <ModeSelectScreen
            onGoHome={goHome}
            onSelectEasy={handleSelectEasy}
            onSelectNormal={() => { setIsEasyMode(false); setPage('common-menu-select') }}
            onStaffCall={callStaff}
          />
        )

      // ── 쉬운 모드 ────────────────────────────────────────────────────
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
            onStaffCall={callStaff}
            onCancelOrder={() => setPage('common-option')}
            onAddMenu={() => {
              addToCommonCart(commonOrderLine)
              setPage('common-menu-select')
            }}
          />
        )

      case 'order-confirm':
        return (
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff}>
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
          <OrderFlowShell onHome={goHome} onStaffCall={callStaff} aiMessage={displayMessage}>
            <PaymentSelect
              onNext={handlePaymentDone}
              onPrev={() => setPage(orderConfirmSource.current)}
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

  // 어드민 페이지는 StageViewport 밖에서 풀페이지로 렌더
  if (page === 'admin') return <BannerAdminPage />

  return (
    <StageViewport>
      <div key={page} style={stagePageStyle}>
        {renderPage()}
      </div>
    </StageViewport>
  )
}
