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

function normalize(text: string): string {
  return text.replace(/\s/g, '').toLowerCase()
}

function matchesAny(text: string, keywords: string[]): boolean {
  const norm = normalize(text)
  return keywords.some((k) => norm.includes(normalize(k)))
}

function matchTranscript(transcript: string, currentStep: VoiceAIStep): VoiceAIEvent | null {
  // 네비게이션 명령 최우선
  if (matchesAny(transcript, voiceSynonyms.navigation.exit)) {
    return { aiResponse: '처음 화면으로 돌아갑니다.', action: { type: 'GO_HOME', payload: {} } }
  }
  if (matchesAny(transcript, voiceSynonyms.navigation.back)) {
    return { aiResponse: '이전 화면으로 돌아갑니다.', action: { type: 'GO_BACK', payload: {} } }
  }

  switch (currentStep) {
    case 'STEP2_MENU_SELECT': {
      // 메뉴 이름 먼저 체크 (구체적일수록 우선)
      for (const menu of voiceSynonyms.menus) {
        if (matchesAny(transcript, menu.synonyms)) {
          return {
            aiResponse: `${menu.name} 선택하셨습니다. 온도와 사이즈를 선택해 주세요.`,
            action: { type: 'ADD_CART', payload: { menuName: menu.name, count: 1 } },
            nextStep: 'STEP3_OPTION_SELECT',
          }
        }
      }
      // 장바구니에 담긴 아이템을 결제 화면으로
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
          aiResponse: '아이스로 선택하셨습니다.',
          action: { type: 'SELECT_OPTION', payload: { temp: 'ice' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.options.hot)) {
        return {
          aiResponse: '핫으로 선택하셨습니다.',
          action: { type: 'SELECT_OPTION', payload: { temp: 'hot' } },
        }
      }

      // 사이즈
      if (matchesAny(transcript, voiceSynonyms.options.large)) {
        return {
          aiResponse: '라지 사이즈로 선택하셨습니다.',
          action: { type: 'SELECT_OPTION', payload: { size: 'large' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.options.regular)) {
        return {
          aiResponse: '레귤러 사이즈로 선택하셨습니다.',
          action: { type: 'SELECT_OPTION', payload: { size: 'regular' } },
        }
      }

      // 컵 선택
      if (matchesAny(transcript, voiceSynonyms.cup.mug)) {
        return {
          aiResponse: '머그컵으로 선택하셨습니다.',
          action: { type: 'SELECT_CUP', payload: { cup: 'mug' } },
        }
      }
      if (matchesAny(transcript, voiceSynonyms.cup.personal)) {
        return {
          aiResponse: '개인컵으로 선택하셨습니다.',
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

      // 샷: remove 먼저 → add 순서로 체크 (짧은 add 키워드가 remove 키워드를 포함하는 오매칭 방지)
      if (matchesAny(transcript, co.shot.remove)) {
        return {
          aiResponse: '샷을 하나 뺐습니다.',
          action: { type: 'SET_SHOT', payload: { delta: -1 } },
        }
      }
      if (matchesAny(transcript, co.shot.add)) {
        return {
          aiResponse: '샷을 추가했습니다.',
          action: { type: 'SET_SHOT', payload: { delta: 1 } },
        }
      }

      // 시럽: remove 먼저
      if (matchesAny(transcript, co.syrup.remove)) {
        return {
          aiResponse: '바닐라 시럽을 뺐습니다.',
          action: { type: 'SET_SYRUP', payload: { delta: -1 } },
        }
      }
      if (matchesAny(transcript, co.syrup.add)) {
        return {
          aiResponse: '바닐라 시럽을 추가했습니다.',
          action: { type: 'SET_SYRUP', payload: { delta: 1 } },
        }
      }

      // 펄: remove 먼저 체크 → add (예: "알로에빼"가 "알로에" add에 먼저 매칭되는 문제 방지)
      const pearlEntries = [
        { index: 0, name: '타피오카펄', add: co.pearl.tapioca.add, remove: co.pearl.tapioca.remove },
        { index: 1, name: '화이트펄',   add: co.pearl.white.add,   remove: co.pearl.white.remove   },
        { index: 2, name: '알로에',     add: co.pearl.aloe.add,    remove: co.pearl.aloe.remove    },
      ]
      for (const { index, name, add, remove } of pearlEntries) {
        if (matchesAny(transcript, remove)) {
          return {
            aiResponse: `${name}을 뺐습니다.`,
            action: { type: 'SET_PEARL', payload: { pearlIndex: index, delta: -1 } },
          }
        }
        if (matchesAny(transcript, add)) {
          return {
            aiResponse: `${name}을 추가했습니다.`,
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
          aiResponse: '장바구니에 담았습니다.',
          action: { type: 'ADD_LINE_TO_CART', payload: {} },
          // nextStep 없음 → App.tsx가 easy-menu-select로 이동
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
          aiResponse: `${labels[method]}로 결제하겠습니다.`,
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
          aiResponse: '영수증을 건너뜁니다.',
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

export function useVoiceAI({
  currentStep,
  onEvent,
  onListeningChange,
}: {
  currentStep: VoiceAIStep
  cartSummary?: string
  onEvent: (event: VoiceAIEvent) => void
  onListeningChange?: (listening: boolean) => void
}) {
  const stateRef = useRef({
    currentStep,
    onEvent,
    onListeningChange,
    isProcessing: false,
  })
  stateRef.current.currentStep = currentStep
  stateRef.current.onEvent = onEvent
  stateRef.current.onListeningChange = onListeningChange

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: (new () => any) | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'ko-KR'

    let stopped = false
    // TTS 재생 중임을 표시 — onresult가 TTS 에코를 무시하도록 사용
    let ttsInProgress = false

    const setListening = (v: boolean) => stateRef.current.onListeningChange?.(v)

    recognition.onstart = () => {
      console.log('[STT] 🎙️ 인식 시작')
      setListening(true)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.warn('[STT] ⚠️ 인식 오류:', e.error, e.message)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      if (!last.isFinal) return
      const transcript = last[0].transcript.trim()
      const state = stateRef.current

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
