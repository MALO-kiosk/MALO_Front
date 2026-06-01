import { useEffect, useRef } from 'react'
import voiceSynonyms from '@/config/voiceSynonyms.json'

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
  // 후행 조사 제거: 을/를/이/가/은/는/으로/로/와/과/랑/도/만
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

/**
 * 사용자 발화에서 유사 메뉴를 찾는다.
 * 주문 의도 표현을 제거한 뒤 각 단어를 메뉴명/유사어와 부분 문자열 비교.
 */
function findSimilarMenu(transcript: string): (typeof voiceSynonyms.menus)[0] | null {
  // 주문 의도 제거 후 검색 — "아메리카노 시켜줘" → "아메리카노"로 좁혀서 비교
  const stripped = stripOrderIntent(transcript)
  const searchText = stripped || transcript
  const words = searchText.split(/\s+/).map(normalize).filter((w) => w.length >= 2)
  for (const word of words) {
    for (const menu of voiceSynonyms.menus) {
      const menuNorm = normalize(menu.name)
      if (menuNorm.includes(word) || word.includes(menuNorm)) return menu
      for (const syn of menu.synonyms) {
        const synNorm = normalize(syn)
        if (synNorm.includes(word) || word.includes(synNorm)) return menu
      }
    }
  }
  return null
}

// ─── 매칭 ──────────────────────────────────────────────────────────────────

function matchTranscript(transcript: string, currentStep: VoiceAIStep): VoiceAIEvent | null {
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

      // 메뉴 매칭 헬퍼 — 찾으면 VoiceAIEvent 반환, 없으면 null
      const buildMenuEvent = (menu: (typeof voiceSynonyms.menus)[0]): VoiceAIEvent => {
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

      // ① 원문 발화 그대로 매칭 ("아메리카노", "아메리카노 주세요" 모두 포함)
      for (const menu of voiceSynonyms.menus) {
        if (matchesAny(transcript, menu.synonyms)) return buildMenuEvent(menu)
      }

      // ② 주문 의도 표현·조사 제거 후 재매칭 ("아메리카노를 시켜줘" → "아메리카노")
      const stripped = stripOrderIntent(transcript)
      if (stripped && stripped !== normalize(transcript)) {
        for (const menu of voiceSynonyms.menus) {
          if (matchesAny(stripped, menu.synonyms)) return buildMenuEvent(menu)
        }
      }

      // ③ 없는 메뉴 요청 — 유사 메뉴 추천 또는 안내
      if (isQuestion || transcript.length >= 2) {
        const keyword = extractKeyword(transcript)
        if (keyword) {
          const similar = findSimilarMenu(keyword || transcript)
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

      // ④ 장바구니 아이템 결제 화면으로
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

      // 온도
      if (matchesAny(transcript, voiceSynonyms.options.ice)) {
        return {
          aiResponse: '아이스로 설정했습니다.',
          action: { type: 'SELECT_OPTION', payload: { temp: 'ice' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.options.hot)) {
        return {
          aiResponse: '핫으로 설정했습니다.',
          action: { type: 'SELECT_OPTION', payload: { temp: 'hot' } },
        }
      }

      // 사이즈
      if (matchesAny(transcript, voiceSynonyms.options.large)) {
        return {
          aiResponse: '라지 사이즈로 설정했습니다.',
          action: { type: 'SELECT_OPTION', payload: { size: 'large' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.options.regular)) {
        return {
          aiResponse: '레귤러 사이즈로 설정했습니다.',
          action: { type: 'SELECT_OPTION', payload: { size: 'regular' } },
        }
      }

      // 컵 선택
      if (matchesAny(transcript, voiceSynonyms.cup.mug)) {
        return {
          aiResponse: '머그컵으로 설정했습니다.',
          action: { type: 'SELECT_CUP', payload: { cup: 'mug' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.cup.personal)) {
        return {
          aiResponse: '개인컵으로 설정했습니다.',
          action: { type: 'SELECT_CUP', payload: { cup: 'personal' } },
        }
      }

      // 당도
      if (matchesAny(transcript, co.sweetness.more)) {
        return {
          aiResponse: '더 달게 설정했습니다.',
          action: { type: 'SET_SWEETNESS', payload: { sweetness: 'more' } },
        }
      }
      if (matchesAny(transcript, co.sweetness.less)) {
        return {
          aiResponse: '덜 달게 설정했습니다.',
          action: { type: 'SET_SWEETNESS', payload: { sweetness: 'less' } },
        }
      }
      if (matchesAny(transcript, co.sweetness.normal)) {
        return {
          aiResponse: '보통 당도로 설정했습니다.',
          action: { type: 'SET_SWEETNESS', payload: { sweetness: 'normal' } },
        }
      }

      // 샷: remove 먼저 (짧은 add 키워드가 remove 문자열을 포함하는 오매칭 방지)
      if (matchesAny(transcript, co.shot.remove)) {
        return {
          aiResponse: '샷을 하나 줄였습니다.',
          action: { type: 'SET_SHOT', payload: { delta: -1 } },
        }
      }
      if (matchesAny(transcript, co.shot.add)) {
        return {
          aiResponse: '샷 추가 설정했습니다.',
          action: { type: 'SET_SHOT', payload: { delta: 1 } },
        }
      }

      // 시럽: remove 먼저
      if (matchesAny(transcript, co.syrup.remove)) {
        return {
          aiResponse: '바닐라 시럽을 줄였습니다.',
          action: { type: 'SET_SYRUP', payload: { delta: -1 } },
        }
      }
      if (matchesAny(transcript, co.syrup.add)) {
        return {
          aiResponse: '바닐라 시럽 추가 설정했습니다.',
          action: { type: 'SET_SYRUP', payload: { delta: 1 } },
        }
      }

      // 펄: remove 먼저 (예: "알로에빼"가 "알로에" add에 먼저 매칭되는 버그 방지)
      const pearlEntries = [
        { index: 0, name: '타피오카펄', add: co.pearl.tapioca.add, remove: co.pearl.tapioca.remove },
        { index: 1, name: '화이트펄',   add: co.pearl.white.add,   remove: co.pearl.white.remove   },
        { index: 2, name: '알로에',     add: co.pearl.aloe.add,    remove: co.pearl.aloe.remove    },
      ]
      for (const { index, name, add, remove } of pearlEntries) {
        if (matchesAny(transcript, remove)) {
          return {
            aiResponse: `${name}${eulRul(name)} 줄였습니다.`,
            action: { type: 'SET_PEARL', payload: { pearlIndex: index, delta: -1 } },
          }
        }
        if (matchesAny(transcript, add)) {
          return {
            aiResponse: `${name} 추가 설정했습니다.`,
            action: { type: 'SET_PEARL', payload: { pearlIndex: index, delta: 1 } },
          }
        }
      }

      // 맞춤 옵션 화면으로 이동
      if (matchesAny(transcript, co.open)) {
        return {
          aiResponse: '맞춤 옵션 화면으로 이동합니다.',
          action: { type: 'OPEN_CUSTOM_OPTION', payload: {} },
        }
      }

      // 장바구니에 담기 → 메뉴 선택 화면으로 복귀
      if (matchesAny(transcript, co.addToCart)) {
        return {
          aiResponse: '주문이 담겼습니다. 추가로 주문하실 메뉴가 있으신가요?',
          action: { type: 'ADD_LINE_TO_CART', payload: {} },
        }
      }

      // 주문 확인 → 현재 아이템 장바구니 담은 뒤 주문 확인 화면으로
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
      // 결제 화면: 모바일 페이 / 쿠폰사용 / 할인 수단 / 앱 카드 / 신용카드
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
        const labels: Record<string, string> = {
          MOBILE: '모바일 페이',
          COUPON: '쿠폰',
          DISCOUNT: '할인 수단',
          APP_CARD: '앱 카드',
          CARD: '신용카드',
        }
        return {
          aiResponse: `${labels[method]}로 결제하겠습니다. 잠시만 기다려 주세요.`,
          action: { type: 'SET_PAYMENT', payload: { method } },
        }
      }
      return null
    }

    case 'STEP6_STAMP': {
      if (matchesAny(transcript, voiceSynonyms.stamp.skip)) {
        return {
          aiResponse: '스탬프 적립을 건너뜁니다.',
          action: { type: 'SET_STAMP', payload: { earn: false } },
        }
      }
      // 숫자 10자리 이상 → 전화번호로 인식
      const digits = transcript.replace(/[^0-9]/g, '')
      if (digits.length >= 10) {
        return {
          aiResponse: '스탬프를 적립하겠습니다.',
          action: { type: 'SET_STAMP', payload: { earn: true, phone: digits } },
        }
      }
      return null
    }

    case 'STEP7_RECEIPT': {
      if (matchesAny(transcript, voiceSynonyms.receipt.no)) {
        return {
          aiResponse: '영수증을 출력하지 않겠습니다.',
          action: { type: 'SET_RECEIPT', payload: { receipt: false } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.receipt.yes)) {
        return {
          aiResponse: '영수증을 출력하겠습니다.',
          action: { type: 'SET_RECEIPT', payload: { receipt: true } },
        }
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
  onEvent,
  onListeningChange,
  onTranscriptChange,
}: {
  currentStep: VoiceAIStep
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
  })
  stateRef.current.currentStep = currentStep
  stateRef.current.onEvent = onEvent
  stateRef.current.onListeningChange = onListeningChange
  stateRef.current.onTranscriptChange = onTranscriptChange

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
    // TTS 재생 중임을 표시 — onresult가 TTS 에코를 무시하도록 사용
    let ttsInProgress = false

    const setListening = (v: boolean) => stateRef.current.onListeningChange?.(v)
    const setTranscript = (t: string) => stateRef.current.onTranscriptChange?.(t)

    recognition.onstart = () => {
      console.log('[STT] 🎙️ 인식 시작')
      setListening(true)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn('[STT] ⚠️ 인식 오류:', e.error, e.message)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      const transcript = last[0].transcript.trim()
      const state = stateRef.current

      // 중간 결과 — 사용자가 말하기 시작하면 재생 중인 안내 음성 즉시 중단
      if (!last.isFinal) {
        if (ttsInProgress || window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel()
          ttsInProgress = false
          state.isProcessing = false
        }
        setTranscript(transcript)
        return
      }

      // 최종 결과 — 실시간 표시 초기화
      setTranscript('')
      console.log('[STT] 📝 인식된 발화:', transcript)

      if (!transcript) return
      if (state.isProcessing) {
        console.log('[STT] ⏭️ 이미 처리 중 — 무시')
        return
      }
      // TTS 재생 중이거나 speechSynthesis가 말하는 중이면 에코로 판단하고 무시
      if (ttsInProgress || window.speechSynthesis.speaking) {
        console.log('[STT] ⏭️ TTS 에코 — 무시')
        return
      }

      state.isProcessing = true
      setListening(false)

      const matched = matchTranscript(transcript, state.currentStep)
      console.log('[STT] 🔍 매칭 결과:', matched)

      if (matched) {
        // STT를 멈추지 않고 계속 유지 — TTS 종료 즉시 사용자 발화를 받을 수 있도록
        ttsInProgress = true
        speak(matched.aiResponse, () => {
          console.log('[TTS] ✅ 재생 완료')
          ttsInProgress = false
          state.isProcessing = false
          setListening(true)
        })
        state.onEvent(matched)
      } else {
        // 매칭 없음 — 즉시 리셋
        state.isProcessing = false
        setListening(true)
      }
    }

    // 브라우저가 자동으로 세션을 종료한 경우 (타임아웃 등) 항상 재시작
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
    }
  }, [])
}
