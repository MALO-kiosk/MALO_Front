import { useEffect, useRef } from 'react'
import voiceSynonyms from '@/config/voiceSynonyms.json'
import type { MenuProduct } from '@/data/menuCatalog'
import { isDesertProduct } from '@/data/menuCatalog'

export type VoiceAIStep =
  | 'STEP1_GREETING'
  | 'STEP2_MENU_SELECT'
  | 'STEP3_OPTION_SELECT'
  | 'STEP4_CONFIRM'
  | 'STEP5_PAYMENT'
  | 'STEP6_STAMP'
  | 'STEP7_RECEIPT'
  | 'STEP8_COMPLETE'

export type VoiceAIAction = {
  type:
    | 'ADD_CART'
    | 'SELECT_OPTION'
    | 'SELECT_CUP'
    | 'OPEN_CUSTOM_OPTION'
    | 'ADD_LINE_TO_CART'
    | 'SET_SHOT'
    | 'SET_SYRUP'
    | 'SET_SWEETNESS'
    | 'SET_PEARL'
    | 'CONFIRM_ORDER'
    | 'SET_PAYMENT'
    | 'SET_STAMP'
    | 'SET_RECEIPT'
    | 'CALL_STAFF'
    | 'GO_HOME'
    | 'GO_BACK'
  payload: Record<string, unknown>
}

export type VoiceAIEvent = {
  aiResponse: string
  nextStep?: VoiceAIStep
  action?: VoiceAIAction
}

/** matchTranscript 내부용 — 복수 후보 정보를 onresult로 전달하는 마커 */
type InternalVoiceEvent = VoiceAIEvent & { __candidates?: MenuEntry[] }

/** 동적 메뉴 엔트리 — Supabase 메뉴 데이터 기반으로 생성 */
export type MenuEntry = {
  name: string
  synonyms: string[]
  isDesert: boolean
}

export const GREETING_MESSAGE = '안녕하세요! 원하시는 메뉴를 말씀해 주시거나 선택해 주세요.'

export function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()

  // Chrome bug: cancel() 직후 speak() 하면 무시되는 경우가 있어 50ms 지연
  setTimeout(() => {
    window.speechSynthesis.resume()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'ko-KR'
    utt.rate = 1.05
    utt.pitch = 1.0
    if (onEnd) utt.onend = onEnd

    const voices = window.speechSynthesis.getVoices()
    const koVoice = voices.find((v) => v.lang.startsWith('ko'))
    if (koVoice) utt.voice = koVoice
    window.speechSynthesis.speak(utt)
  }, 50)
}

// ─── 헬퍼 함수 ─────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.replace(/\s/g, '').toLowerCase()
}

function matchesAny(text: string, keywords: string[]): boolean {
  const norm = normalize(text)
  return keywords.some((k) => norm.includes(normalize(k)))
}

/** 받침 유무에 따라 을/를 반환 */
function eulRul(name: string): '을' | '를' {
  const last = name[name.length - 1]
  if (!last) return '을'
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return '을'
  return (code - 0xac00) % 28 === 0 ? '를' : '을'
}

/**
 * 주문 의도 표현 및 후행 조사를 제거해 핵심 메뉴명만 추출한다.
 * 예) "아메리카노를 시켜줘" → "아메리카노"
 */
function stripOrderIntent(transcript: string): string {
  let text = normalize(transcript)
  for (const word of voiceSynonyms.orderIntent) {
    text = text.replaceAll(normalize(word), '')
  }
  // 수량 표현 제거 (하나, 두개, 세잔 등)
  text = text.replace(/[일이삼사오육칠팔구십]+(개|잔|그릇|병)?/g, '')
  text = text.replace(/\d+(개|잔)?/g, '')
  // 후행 조사 제거
  text = text.replace(/(을|를|이|가|은|는|으로|로|와|과|랑|이랑|도|만)$/, '')
  return text.trim()
}

/** 발화에서 한국어 수량 표현을 파싱한다. 없으면 1 반환 */
function extractQuantity(transcript: string): number {
  const norm = normalize(transcript)
  const map: Array<[string, number]> = [
    ['다섯개', 5], ['다섯잔', 5], ['오개', 5],
    ['네개', 4], ['네잔', 4], ['사개', 4],
    ['세개', 3], ['세잔', 3], ['삼개', 3],
    ['두개', 2], ['두잔', 2], ['이개', 2],
    ['한개', 1], ['한잔', 1], ['하나', 1],
  ]
  for (const [word, n] of map) {
    if (norm.includes(normalize(word))) return n
  }
  const m = transcript.match(/(\d+)\s*(?:개|잔)/)
  if (m) return Math.min(10, parseInt(m[1], 10))
  return 1
}

/** 질문 조사("있어요" 등)를 제거한 핵심 메뉴 키워드 추출 */
function extractKeyword(transcript: string): string {
  return transcript
    .replace(/있어요|있나요|있나|파나요|되나요|있습니까|있죠|주세요|줘|드릴게요|주문할게요|주문할래요|원해요/g, '')
    .trim()
}

// ─── 동적 메뉴 엔트리 생성 ─────────────────────────────────────────────────

type StaticMenu = { name: string; synonyms: string[]; isDesert: boolean }

/**
 * Supabase 메뉴 목록 → MenuEntry 변환.
 * 메뉴명에서 자동 유사어(공백 제거, 단어 분리)를 생성하고
 * voiceSynonyms.json 정적 유사어가 있으면 병합한다.
 */
export function buildMenuEntries(products: MenuProduct[]): MenuEntry[] {
  const staticMenus = voiceSynonyms.menus as StaticMenu[]
  return products.map((p) => {
    const words = p.name.split(/\s+/).filter((w) => w.length >= 2)
    const autoSynonyms = [p.name, p.name.replace(/\s/g, ''), ...words]
    const staticEntry = staticMenus.find((m) => normalize(m.name) === normalize(p.name))
    const staticSynonyms = staticEntry?.synonyms ?? []
    return {
      name: p.name,
      synonyms: [...new Set([...autoSynonyms, ...staticSynonyms])],
      isDesert: isDesertProduct(p),
    }
  })
}

/** Supabase 미로드 시 폴백 — voiceSynonyms.json 정적 목록 사용 */
const FALLBACK_MENU_ENTRIES: MenuEntry[] = (voiceSynonyms.menus as StaticMenu[]).map((m) => ({
  name: m.name,
  synonyms: m.synonyms,
  isDesert: m.isDesert,
}))

function getActiveMenuEntries(products: MenuProduct[]): MenuEntry[] {
  return products.length > 0 ? buildMenuEntries(products) : FALLBACK_MENU_ENTRIES
}

// ─── 유사도 매칭 ───────────────────────────────────────────────────────────

/** 레벤슈타인 거리 — STT 오인식 대비 퍼지 매칭용 */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1]![j - 1]!
          : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
    }
  }
  return dp[m]![n]!
}

/**
 * 발화에서 유사 메뉴를 찾는다.
 * ① 부분 문자열 매칭 → ② 레벤슈타인 퍼지 매칭 순으로 시도.
 */
function findSimilarMenu(transcript: string, menus: MenuEntry[]): MenuEntry | null {
  const stripped = stripOrderIntent(transcript)
  const searchText = stripped || transcript
  const words = searchText.split(/\s+/).map(normalize).filter((w) => w.length >= 2)

  for (const word of words) {
    for (const menu of menus) {
      const menuNorm = normalize(menu.name)
      if (menuNorm.includes(word) || word.includes(menuNorm)) return menu
      for (const syn of menu.synonyms) {
        const synNorm = normalize(syn)
        if (synNorm.includes(word) || word.includes(synNorm)) return menu
      }
    }
  }

  for (const word of words) {
    if (word.length < 3) continue
    for (const menu of menus) {
      const menuNorm = normalize(menu.name)
      const threshold = Math.floor(menuNorm.length * 0.3)
      if (threshold > 0 && levenshtein(word, menuNorm) <= threshold) return menu
    }
  }

  return null
}

// ─── 후보 선택(disambiguation) 해소 ───────────────────────────────────────

/**
 * 후보 목록 안에서 발화를 엄격하게 매칭해 ADD_CART 이벤트를 반환한다.
 *
 * 일반 메뉴 검색과 달리 개별 단어 유사어를 사용하지 않고
 * 후보 메뉴명 전체(공백 무시)만 대상으로 비교하기 때문에
 * "주스"처럼 여러 메뉴에 공통되는 단어로 인한 오매칭을 방지한다.
 *
 * 매칭 순서:
 *   1. 정규화된 전체 이름 정확 일치
 *   2. 발화가 후보 이름을 포함하거나, 후보 이름이 발화를 포함 (유일 후보만)
 *   3. 레벤슈타인 퍼지 매칭 (후보 이름 길이의 30% 허용)
 * 주문 의도 표현 제거 후에도 재시도한다.
 */
function resolveDisambiguation(
  transcript: string,
  candidates: MenuEntry[],
  qty: number,
): VoiceAIEvent | null {
  const normRaw = normalize(transcript)
  const normStripped = stripOrderIntent(transcript)
  const toTry = [...new Set([normRaw, normStripped].filter(Boolean))]

  for (const searchText of toTry) {
    // 1. 정확한 이름 일치
    for (const c of candidates) {
      if (normalize(c.name) === searchText) return buildCandidateEvent(c, qty)
    }

    // 2. 이름 포함 관계 — 유일한 후보만 선택 (2개 이상이면 null)
    const nameMatches = candidates.filter((c) => {
      const normName = normalize(c.name)
      return searchText.includes(normName) || normName.includes(searchText)
    })
    if (nameMatches.length === 1) return buildCandidateEvent(nameMatches[0]!, qty)

    // 3. 레벤슈타인 퍼지 매칭
    for (const c of candidates) {
      const normName = normalize(c.name)
      const threshold = Math.floor(normName.length * 0.3)
      if (threshold > 0 && levenshtein(searchText, normName) <= threshold) {
        return buildCandidateEvent(c, qty)
      }
    }
  }

  return null
}

function buildCandidateEvent(menu: MenuEntry, qty: number): VoiceAIEvent {
  const response = menu.isDesert
    ? `${menu.name}${eulRul(menu.name)} 장바구니에 담았습니다. 추가로 주문하실 메뉴가 있으신가요?`
    : `옵션을 선택해 주세요. 추가 옵션이 필요하신가요?`
  return {
    aiResponse: response,
    action: { type: 'ADD_CART', payload: { menuName: menu.name, count: qty } },
    nextStep: 'STEP3_OPTION_SELECT',
  }
}

// ─── 매칭 ──────────────────────────────────────────────────────────────────

function matchTranscript(
  transcript: string,
  currentStep: VoiceAIStep,
  menus: MenuEntry[],
): InternalVoiceEvent | null {
  // 직원 호출 — 모든 단계에서 동작
  if (matchesAny(transcript, voiceSynonyms.staff.call)) {
    return {
      aiResponse: '직원을 호출했습니다. 잠시만 기다려주세요.',
      action: { type: 'CALL_STAFF', payload: {} },
    }
  }

  // 네비게이션 명령 최우선
  if (matchesAny(transcript, voiceSynonyms.navigation.cancel)) {
    return {
      aiResponse: '주문을 취소했습니다. 처음 화면으로 돌아갑니다.',
      action: { type: 'GO_HOME', payload: {} },
    }
  }
  if (matchesAny(transcript, voiceSynonyms.navigation.exit)) {
    return { aiResponse: '처음 화면으로 돌아갑니다.', action: { type: 'GO_HOME', payload: {} } }
  }
  if (matchesAny(transcript, voiceSynonyms.navigation.back)) {
    return { aiResponse: '이전 화면으로 돌아갑니다.', action: { type: 'GO_BACK', payload: {} } }
  }

  switch (currentStep) {
    case 'STEP2_MENU_SELECT': {
      const isQuestion = matchesAny(transcript, voiceSynonyms.questions.existence)
      const qty = extractQuantity(transcript)

      const buildMenuEvent = (menu: MenuEntry): InternalVoiceEvent => {
        if (isQuestion) {
          return {
            aiResponse: `네, ${menu.name} 있습니다. 장바구니에 담아드릴게요.`,
            action: { type: 'ADD_CART', payload: { menuName: menu.name, count: qty } },
            nextStep: 'STEP3_OPTION_SELECT',
          }
        }
        const response = menu.isDesert
          ? `${menu.name}${eulRul(menu.name)} 장바구니에 담았습니다. 추가로 주문하실 메뉴가 있으신가요?`
          : `옵션을 선택해 주세요. 추가 옵션이 필요하신가요?`
        return {
          aiResponse: response,
          action: { type: 'ADD_CART', payload: { menuName: menu.name, count: qty } },
          nextStep: 'STEP3_OPTION_SELECT',
        }
      }

      // ① 원문 발화 그대로 매칭 — 복수 후보 시 __candidates 마커를 달아 반환
      const directMatches = menus.filter((m) => matchesAny(transcript, m.synonyms))
      if (directMatches.length === 1) return buildMenuEvent(directMatches[0]!)
      if (directMatches.length > 1) {
        const names = directMatches.map((m) => m.name).join(', ')
        return {
          aiResponse: `${names} 중에서 어떤 메뉴를 원하시나요? 정확한 메뉴명을 말씀해 주세요.`,
          __candidates: directMatches,
        }
      }

      // ② 주문 의도·조사 제거 후 재매칭
      const stripped = stripOrderIntent(transcript)
      if (stripped && stripped !== normalize(transcript)) {
        const strippedMatches = menus.filter((m) => matchesAny(stripped, m.synonyms))
        if (strippedMatches.length === 1) return buildMenuEvent(strippedMatches[0]!)
        if (strippedMatches.length > 1) {
          const names = strippedMatches.map((m) => m.name).join(', ')
          return {
            aiResponse: `${names} 중에서 어떤 메뉴를 원하시나요? 정확한 메뉴명을 말씀해 주세요.`,
            __candidates: strippedMatches,
          }
        }
      }

      // ③ 없는 메뉴 요청 — 유사 메뉴 추천 또는 안내
      if (isQuestion || transcript.length >= 2) {
        const keyword = extractKeyword(transcript)
        if (keyword) {
          const similar = findSimilarMenu(keyword || transcript, menus)
          if (similar) {
            return {
              aiResponse: `현재 ${keyword} 메뉴가 없습니다. 그 대신 ${similar.name}${eulRul(similar.name)} 추천합니다.`,
            }
          }
          if (isQuestion) {
            return {
              aiResponse: `죄송합니다, 현재 ${keyword} 관련 메뉴가 준비되어 있지 않습니다. 다른 메뉴를 말씀해 주세요.`,
            }
          }
        }
      }

      // ④ 주문 확인 화면으로
      if (matchesAny(transcript, voiceSynonyms.order.confirm)) {
        return {
          aiResponse: '주문 내역을 확인해 드릴게요.',
          nextStep: 'STEP4_CONFIRM',
        }
      }

      return null
    }

    case 'STEP3_OPTION_SELECT': {
      const co = voiceSynonyms.customOptions

      if (matchesAny(transcript, voiceSynonyms.options.ice)) {
        return { aiResponse: '아이스로 설정했습니다.', action: { type: 'SELECT_OPTION', payload: { temp: 'ice' } } }
      }
      if (matchesAny(transcript, voiceSynonyms.options.hot)) {
        return { aiResponse: '핫으로 설정했습니다.', action: { type: 'SELECT_OPTION', payload: { temp: 'hot' } } }
      }
      if (matchesAny(transcript, voiceSynonyms.options.large)) {
        return { aiResponse: '라지 사이즈로 설정했습니다.', action: { type: 'SELECT_OPTION', payload: { size: 'large' } } }
      }
      if (matchesAny(transcript, voiceSynonyms.options.regular)) {
        return { aiResponse: '레귤러 사이즈로 설정했습니다.', action: { type: 'SELECT_OPTION', payload: { size: 'regular' } } }
      }
      if (matchesAny(transcript, voiceSynonyms.cup.mug)) {
        return { aiResponse: '머그컵으로 설정했습니다.', action: { type: 'SELECT_CUP', payload: { cup: 'mug' } } }
      }
      if (matchesAny(transcript, voiceSynonyms.cup.personal)) {
        return { aiResponse: '개인컵으로 설정했습니다.', action: { type: 'SELECT_CUP', payload: { cup: 'personal' } } }
      }
      if (matchesAny(transcript, co.sweetness.more)) {
        return { aiResponse: '더 달게 설정했습니다.', action: { type: 'SET_SWEETNESS', payload: { sweetness: 'more' } } }
      }
      if (matchesAny(transcript, co.sweetness.less)) {
        return { aiResponse: '덜 달게 설정했습니다.', action: { type: 'SET_SWEETNESS', payload: { sweetness: 'less' } } }
      }
      if (matchesAny(transcript, co.sweetness.normal)) {
        return { aiResponse: '보통 당도로 설정했습니다.', action: { type: 'SET_SWEETNESS', payload: { sweetness: 'normal' } } }
      }
      if (matchesAny(transcript, co.shot.remove)) {
        return { aiResponse: '샷을 하나 줄였습니다.', action: { type: 'SET_SHOT', payload: { delta: -1 } } }
      }
      if (matchesAny(transcript, co.shot.add)) {
        return { aiResponse: '샷 추가 설정했습니다.', action: { type: 'SET_SHOT', payload: { delta: 1 } } }
      }
      if (matchesAny(transcript, co.syrup.remove)) {
        return { aiResponse: '바닐라 시럽을 줄였습니다.', action: { type: 'SET_SYRUP', payload: { delta: -1 } } }
      }
      if (matchesAny(transcript, co.syrup.add)) {
        return { aiResponse: '바닐라 시럽 추가 설정했습니다.', action: { type: 'SET_SYRUP', payload: { delta: 1 } } }
      }

      const pearlEntries = [
        { index: 0, name: '타피오카펄', add: co.pearl.tapioca.add, remove: co.pearl.tapioca.remove },
        { index: 1, name: '화이트펄',   add: co.pearl.white.add,   remove: co.pearl.white.remove   },
        { index: 2, name: '알로에',     add: co.pearl.aloe.add,    remove: co.pearl.aloe.remove    },
      ]
      for (const { index, name, add, remove } of pearlEntries) {
        if (matchesAny(transcript, remove)) {
          return { aiResponse: `${name}${eulRul(name)} 줄였습니다.`, action: { type: 'SET_PEARL', payload: { pearlIndex: index, delta: -1 } } }
        }
        if (matchesAny(transcript, add)) {
          return { aiResponse: `${name} 추가 설정했습니다.`, action: { type: 'SET_PEARL', payload: { pearlIndex: index, delta: 1 } } }
        }
      }

      if (matchesAny(transcript, co.open)) {
        return { aiResponse: '맞춤 옵션 화면으로 이동합니다.', action: { type: 'OPEN_CUSTOM_OPTION', payload: {} } }
      }
      if (matchesAny(transcript, co.addToCart)) {
        return { aiResponse: '주문이 담겼습니다. 추가로 주문하실 메뉴가 있으신가요?', action: { type: 'ADD_LINE_TO_CART', payload: {} } }
      }
      if (matchesAny(transcript, voiceSynonyms.order.confirm)) {
        return {
          aiResponse: '주문 내역을 확인해 드릴게요.',
          action: { type: 'ADD_LINE_TO_CART', payload: {} },
          nextStep: 'STEP4_CONFIRM',
        }
      }
      return null
    }

    case 'STEP4_CONFIRM': {
      if (matchesAny(transcript, voiceSynonyms.order.confirm)) {
        return {
          aiResponse: '결제 수단을 선택해 주세요.',
          action: { type: 'CONFIRM_ORDER', payload: {} },
          nextStep: 'STEP5_PAYMENT',
        }
      }
      return null
    }

    case 'STEP5_PAYMENT': {
      const { mobilePay, coupon, discount, appCard, creditCard } = voiceSynonyms.payment
      const method = matchesAny(transcript, mobilePay)
        ? 'MOBILE'
        : matchesAny(transcript, coupon)
          ? 'COUPON'
          : matchesAny(transcript, discount)
            ? 'DISCOUNT'
            : matchesAny(transcript, appCard)
              ? 'APP_CARD'
              : matchesAny(transcript, creditCard)
                ? 'CARD'
                : null
      if (method) {
        const labels: Record<string, string> = { MOBILE: '모바일 페이', COUPON: '쿠폰', DISCOUNT: '할인 수단', APP_CARD: '앱 카드', CARD: '신용카드' }
        return {
          aiResponse: `${labels[method]}로 결제하겠습니다. 잠시만 기다려 주세요.`,
          action: { type: 'SET_PAYMENT', payload: { method } },
        }
      }
      return null
    }

    case 'STEP6_STAMP': {
      if (matchesAny(transcript, voiceSynonyms.stamp.skip)) {
        return { aiResponse: '스탬프 적립을 건너뜁니다.', action: { type: 'SET_STAMP', payload: { earn: false } } }
      }
      const digits = transcript.replace(/[^0-9]/g, '')
      if (digits.length >= 10) {
        return { aiResponse: '스탬프를 적립하겠습니다.', action: { type: 'SET_STAMP', payload: { earn: true, phone: digits } } }
      }
      return null
    }

    case 'STEP7_RECEIPT': {
      if (matchesAny(transcript, voiceSynonyms.receipt.no)) {
        return { aiResponse: '영수증을 출력하지 않겠습니다.', action: { type: 'SET_RECEIPT', payload: { receipt: false } } }
      }
      if (matchesAny(transcript, voiceSynonyms.receipt.yes)) {
        return { aiResponse: '영수증을 출력하겠습니다.', action: { type: 'SET_RECEIPT', payload: { receipt: true } } }
      }
      return null
    }

    default:
      return null
  }
}

// ─── 훅 ────────────────────────────────────────────────────────────────────

export function useVoiceAI({
  currentStep,
  menuProducts,
  onEvent,
  onListeningChange,
  onTranscriptChange,
}: {
  currentStep: VoiceAIStep
  menuProducts?: MenuProduct[]
  cartSummary?: string
  onEvent: (event: VoiceAIEvent) => void
  onListeningChange?: (listening: boolean) => void
  onTranscriptChange?: (transcript: string) => void
}) {
  const stateRef = useRef({
    currentStep,
    onEvent,
    onListeningChange,
    onTranscriptChange,
    isProcessing: false,
    menuProducts: menuProducts ?? [],
    // ── 후보 선택 대기 상태 ─────────────────────────────────────────────
    pendingCandidates: null as MenuEntry[] | null,
    pendingQty: 1,
    pendingAttempts: 0,
    pendingTimeout: null as ReturnType<typeof setTimeout> | null,
  })

  stateRef.current.currentStep = currentStep
  stateRef.current.onEvent = onEvent
  stateRef.current.onListeningChange = onListeningChange
  stateRef.current.onTranscriptChange = onTranscriptChange
  stateRef.current.menuProducts = menuProducts ?? []

  // 단계가 STEP2 밖으로 이동하면 후보 대기 상태를 자동 초기화
  if (currentStep !== 'STEP2_MENU_SELECT' && stateRef.current.pendingCandidates !== null) {
    if (stateRef.current.pendingTimeout) clearTimeout(stateRef.current.pendingTimeout)
    stateRef.current.pendingCandidates = null
    stateRef.current.pendingAttempts = 0
    stateRef.current.pendingTimeout = null
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: (new () => any) | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'ko-KR'

    let stopped = false
    let ttsInProgress = false

    const setListening = (v: boolean) => stateRef.current.onListeningChange?.(v)
    const setTranscript = (t: string) => stateRef.current.onTranscriptChange?.(t)

    recognition.onstart = () => {
      console.log('[STT] 🎙️ 인식 시작')
      setListening(true)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn('[STT] ⚠️ 인식 오류:', e.error, e.message)
      if (e.error === 'not-allowed' || e.error === 'audio-capture') {
        stopped = true
        setListening(false)
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      const transcript = last[0].transcript.trim()
      const state = stateRef.current

      if (!last.isFinal) {
        if (ttsInProgress || window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel()
          ttsInProgress = false
          state.isProcessing = false
        }
        setTranscript(transcript)
        return
      }

      setTranscript('')
      console.log('[STT] 📝 인식된 발화:', transcript)

      if (!transcript) return
      if (state.isProcessing) {
        console.log('[STT] ⏭️ 이미 처리 중 — 무시')
        return
      }
      if (ttsInProgress || window.speechSynthesis.speaking) {
        console.log('[STT] ⏭️ TTS 에코 — 무시')
        return
      }

      state.isProcessing = true
      setListening(false)

      const menus = getActiveMenuEntries(state.menuProducts)
      let matched: VoiceAIEvent | null = null

      if (state.pendingCandidates !== null) {
        // ── 후보 선택 대기 중 ────────────────────────────────────────────
        // 전역 명령(직원호출/홈/뒤로/취소)은 항상 우선 처리
        const globalResult = matchTranscript(transcript, state.currentStep, menus)
        const isGlobal =
          globalResult?.action?.type === 'CALL_STAFF' ||
          globalResult?.action?.type === 'GO_HOME' ||
          globalResult?.action?.type === 'GO_BACK'

        if (isGlobal) {
          // 전역 명령 → 후보 상태 초기화
          if (state.pendingTimeout) clearTimeout(state.pendingTimeout)
          state.pendingCandidates = null
          state.pendingAttempts = 0
          state.pendingTimeout = null
          matched = globalResult
        } else {
          // 후보 목록 내 엄격 매칭 시도
          matched = resolveDisambiguation(transcript, state.pendingCandidates, state.pendingQty)
          if (matched) {
            // 해소 성공 → 상태 초기화
            if (state.pendingTimeout) clearTimeout(state.pendingTimeout)
            state.pendingCandidates = null
            state.pendingAttempts = 0
            state.pendingTimeout = null
            console.log('[STT] ✅ 후보 선택 해소:', matched.action?.payload?.menuName)
          } else {
            state.pendingAttempts++
            console.log(`[STT] ❓ 후보 선택 실패 (${state.pendingAttempts}/3)`)
            if (state.pendingAttempts >= 3) {
              // 3회 실패 → 포기, 처음부터
              if (state.pendingTimeout) clearTimeout(state.pendingTimeout)
              state.pendingCandidates = null
              state.pendingAttempts = 0
              state.pendingTimeout = null
              matched = { aiResponse: '죄송합니다. 처음부터 원하시는 메뉴를 다시 말씀해 주세요.' }
            } else {
              const names = state.pendingCandidates.map((m) => m.name).join(', ')
              matched = { aiResponse: `${names} 중에서 원하시는 메뉴를 다시 말씀해 주세요.` }
            }
          }
        }
      } else {
        // ── 일반 흐름 ────────────────────────────────────────────────────
        const internalResult = matchTranscript(transcript, state.currentStep, menus)

        if (internalResult?.__candidates) {
          // 복수 후보 발견 → 후보 대기 상태 저장
          state.pendingCandidates = internalResult.__candidates
          state.pendingQty = extractQuantity(transcript)
          state.pendingAttempts = 0
          // 30초 타임아웃 — 장시간 응답 없을 경우 자동 초기화
          if (state.pendingTimeout) clearTimeout(state.pendingTimeout)
          state.pendingTimeout = setTimeout(() => {
            console.log('[STT] ⏰ 후보 선택 타임아웃 — 상태 초기화')
            state.pendingCandidates = null
            state.pendingAttempts = 0
            state.pendingTimeout = null
          }, 30_000)
          // __candidates 제거 후 이벤트 발행
          const { __candidates: _ignored, ...cleanEvent } = internalResult
          matched = cleanEvent
          console.log('[STT] 🔀 후보 대기 시작:', state.pendingCandidates.map(m => m.name))
        } else {
          matched = internalResult
        }
      }

      console.log('[STT] 🔍 최종 매칭:', matched, '| 활성 메뉴 수:', menus.length)

      if (matched) {
        ttsInProgress = true
        speak(matched.aiResponse, () => {
          console.log('[TTS] ✅ 재생 완료')
          ttsInProgress = false
          state.isProcessing = false
          setListening(true)
        })
        state.onEvent(matched)
      } else {
        state.isProcessing = false
        setListening(true)
      }
    }

    recognition.onend = () => {
      console.log('[STT] 🔇 인식 세션 종료 — 재시작')
      setListening(false)
      if (!stopped) recognition.start()
    }

    console.log('[STT] 🚀 음성 인식 초기화 완료')
    recognition.start()

    return () => {
      stopped = true
      recognition.onend = null
      recognition.stop()
      window.speechSynthesis.cancel()
      // 후보 선택 타임아웃 정리
      if (stateRef.current.pendingTimeout) {
        clearTimeout(stateRef.current.pendingTimeout)
        stateRef.current.pendingTimeout = null
      }
    }
  }, [])
}
