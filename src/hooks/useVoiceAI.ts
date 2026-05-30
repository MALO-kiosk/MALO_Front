import { useEffect, useRef } from 'react'

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
  type: 'ADD_CART' | 'SELECT_OPTION' | 'CONFIRM_ORDER' | 'SET_PAYMENT' | 'SET_STAMP' | 'SET_RECEIPT'
  payload: Record<string, unknown>
}

export type VoiceAIEvent = {
  aiResponse: string
  nextStep?: VoiceAIStep
  action?: VoiceAIAction
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

/** 요청 사이 최소 간격 (ms) — 무료 티어 429 방지 */
const MIN_REQUEST_INTERVAL_MS = 2000

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

const SYSTEM_PROMPT = `당신은 키오스크 브랜드 'MALO'의 친절하고 직관적인 AI 서비스 도우미입니다.

[출력 포맷 규칙]
1. 마크다운 백틱이나 json이라는 단어를 절대 붙이지 마세요. 오직 순수한 JSON 문자열만 반환하세요.
2. 답변은 1~2문장의 간결한 구어체(~요, ~세요)로만 작성하세요.
3. "화면을 전환하겠습니다" 같은 UI 제어 멘트는 절대 하지 마세요.

[출력 JSON 포맷] nextStep과 action은 필요할 때만 포함:
{"aiResponse":"말풍선 텍스트","nextStep":"STEP값(선택)","action":{"type":"액션타입","payload":{}}}

[단계별 행동]

STEP2_MENU_SELECT: 사용자가 메뉴를 말하면
→ action: {"type":"ADD_CART","payload":{"menuName":"메뉴명","count":수량}}
→ 음료/커피라면 nextStep: "STEP3_OPTION_SELECT"

STEP3_OPTION_SELECT: 온도/사이즈 물어보기
→ 옵션 받으면 action: {"type":"SELECT_OPTION","payload":{"temp":"ice|hot","size":"regular|large"}}
→ "더 없어"/"주문할래"/"장바구니로" 등 주문 의사 표현 시 nextStep: "STEP4_CONFIRM"

STEP4_CONFIRM: 장바구니 내역 확인
→ 동의하면 action: {"type":"CONFIRM_ORDER","payload":{}} + nextStep: "STEP5_PAYMENT"

STEP5_PAYMENT: "신용카드와 카카오페이 중 어떤 것으로 결제하시겠어요?" 질문
→ 선택하면 action: {"type":"SET_PAYMENT","payload":{"method":"CARD|KAKAO"}}

STEP6_STAMP: "스탬프를 적립하시겠어요? 안 하시려면 안해 라고 말씀해 주세요."
→ 거절: action: {"type":"SET_STAMP","payload":{"earn":false}}
→ 번호 말하면: action: {"type":"SET_STAMP","payload":{"earn":true,"phone":"숫자만"}}

STEP7_RECEIPT: "영수증이 필요하신가요? 필요 없으시면 하지마 라고 말씀해 주세요."
→ 거절: action: {"type":"SET_RECEIPT","payload":{"receipt":false}}
→ 원함: action: {"type":"SET_RECEIPT","payload":{"receipt":true}}

STEP8_COMPLETE: aiResponse는 항상 "주문이 완료됐습니다. 진동벨을 가지고 가주세요!"

[MALO 메뉴 목록]
스트로베리말차(3900원), 피치프라페(4200원), 아메리카노(3500원), 카페라떼(4000원),
디카페인라떼(4300원), 청포도에이드(4500원), 캐모마일티(3800원),
버터크루아상(3200원/디저트), 뉴욕치즈케이크(4800원/디저트), 소금빵(2900원/디저트),
콜드브루(4100원), 유자민트티(3900원)`

export const GREETING_MESSAGE = '안녕하세요! MALO 음성 주문입니다. 원하시는 메뉴를 편하게 말씀해 주세요.'

export function useVoiceAI({
  currentStep,
  cartSummary,
  onEvent,
  onListeningChange,
}: {
  currentStep: VoiceAIStep
  cartSummary: string
  onEvent: (event: VoiceAIEvent) => void
  onListeningChange?: (listening: boolean) => void
}) {
  const stateRef = useRef({
    currentStep,
    cartSummary,
    onEvent,
    onListeningChange,
    isProcessing: false,
    lastRequestAt: 0,
  })
  stateRef.current.currentStep = currentStep
  stateRef.current.cartSummary = cartSummary
  stateRef.current.onEvent = onEvent
  stateRef.current.onListeningChange = onListeningChange

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI: (new () => SpeechRecognition) | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'ko-KR'

    let stopped = false
    let ttsInProgress = false

    const setListening = (v: boolean) => stateRef.current.onListeningChange?.(v)

    recognition.onstart = () => setListening(true)

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      if (!last.isFinal) return
      const transcript = last[0].transcript.trim()
      const state = stateRef.current

      if (!transcript || state.isProcessing || ttsInProgress) return

      const now = Date.now()
      if (now - state.lastRequestAt < MIN_REQUEST_INTERVAL_MS) return

      setListening(false)
      state.isProcessing = true
      state.lastRequestAt = now
      const { currentStep: step, cartSummary: cart, onEvent: emit } = state

      try {
        const userMessage =
          `[현재 단계: ${step}]\n[장바구니: ${cart}]\n사용자 발화: "${transcript}"`
        const res = await fetch(GEMINI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          }),
        })

        if (res.status === 429) {
          stateRef.current.lastRequestAt = Date.now() + 3000
          return
        }

        const data = await res.json()
        const raw: string = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
        const parsed: VoiceAIEvent = JSON.parse(raw)

        // TTS 재생 후 STT 재개 — utt.onend 콜백으로 처리 (SpeechSynthesis 객체는 end 이벤트 없음)
        ttsInProgress = true
        recognition.stop()
        speak(parsed.aiResponse, () => {
          ttsInProgress = false
          if (!stopped) recognition.start()
        })

        emit(parsed)
      } catch {
        ttsInProgress = false
        // silently ignore network/parse errors
      } finally {
        stateRef.current.isProcessing = false
      }
    }

    recognition.onend = () => {
      setListening(false)
      // TTS 재생 중 STT가 종료된 경우 ttsInProgress의 onEnd 콜백이 재시작 담당
      if (!stopped && !ttsInProgress) recognition.start()
    }

    recognition.start()

    return () => {
      stopped = true
      recognition.onend = null
      recognition.stop()
      window.speechSynthesis.cancel()
    }
  }, []) // runs once — live state accessed via stateRef
}
