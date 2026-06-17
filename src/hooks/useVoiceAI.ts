import { useEffect, useRef } from 'react'
import voiceSynonyms from '@/config/voiceSynonyms.json'
import type { MenuProduct } from '@/data/menuCatalog'
import { isDesertProduct } from '@/data/menuCatalog'

// ─── 공개 타입 ──────────────────────────────────────────────────────────────

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

/** 내부 전용: 메뉴 후보 리스트를 실어 disambiguation 흐름으로 진입 */
type InternalVoiceEvent = VoiceAIEvent & {
  __candidates?: MenuMatchCandidate[]
}

/** 관리자 페이지에서 가져온 메뉴를 음성 매칭에 쓰는 형태 */
export type MenuEntry = {
  name: string
  synonyms: string[]
  isDesert: boolean
}

/** 유사도 점수가 붙은 후보 */
export type MenuMatchCandidate = {
  entry: MenuEntry
  similarity: number
}

// ─── 상수 ───────────────────────────────────────────────────────────────────

export const GREETING_MESSAGE = '안녕하세요! 원하시는 메뉴를 말씀해 주시거나 선택해 주세요.'

/** ≥ 이 값이면 자동 선택 (STT 미세 오류 수준) */
const AUTO_SELECT_THRESHOLD = 0.90
/** ≥ 이 값이면 후보로 표시해 사용자 확인 요청 */
const CONFIRM_THRESHOLD = 0.65
/** disambiguation 최대 시도 횟수 */
const MAX_DISAMBIG_ATTEMPTS = 3
/** disambiguation 세션 타임아웃 (ms) */
const DISAMBIG_TIMEOUT_MS = 30_000

// ─── TTS ────────────────────────────────────────────────────────────────────

export function speak(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
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

// ─── 한국어 자모 분해 기반 발음 유사도 ─────────────────────────────────────

/** 한글 자모 — 19 초성, 21 중성, 28 종성(공란 포함) */
const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const VOWELS   = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const FINALS   = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'

/** 완성형 한글 음절을 초성+중성(+종성) 자모 문자열로 분해 */
function decomposeJamo(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0)
      if (code < 0xac00 || code > 0xd7a3) return ch
      const n = code - 0xac00
      const fin = n % 28
      const vow = Math.floor(n / 28) % 21
      const ini = Math.floor(n / 28 / 21)
      return INITIALS[ini]! + VOWELS[vow]! + (fin > 0 ? FINALS[fin]! : '')
    })
    .join('')
}

/**
 * 현대 한국어에서 동일하게 발음되는 자모를 통일해 STT 오인식에 강하게 만든다.
 *   ㅐ/ㅒ → ㅔ/ㅖ: 현대 표준어에서 사실상 구분 없음 (예: 배/베, 얘/예)
 */
function phoneticNormalize(jamo: string): string {
  return jamo.replace(/ㅐ/g, 'ㅔ').replace(/ㅒ/g, 'ㅖ')
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i, ...Array<number>(n).fill(0)]
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]!
          : 1 + Math.min(prev[j]!, curr[j - 1]!, prev[j - 1]!)
    }
    prev = curr
  }
  return prev[n]!
}

/**
 * 두 한국어 문자열의 자모 단위 발음 유사도를 0~1 로 반환한다.
 * 1 = 완전 일치, 0 = 완전 다름.
 *
 * ㅐ↔ㅔ 와 같이 현대 한국어에서 동일 발음인 자모를 정규화하므로
 * "우배라떼" vs "우베라떼"처럼 STT 가 흔히 혼동하는 쌍도 1.0 반환.
 */
function jamoSimilarity(a: string, b: string): number {
  const ja = phoneticNormalize(decomposeJamo(a))
  const jb = phoneticNormalize(decomposeJamo(b))
  const dist = levenshtein(ja, jb)
  const maxLen = Math.max(ja.length, jb.length)
  return maxLen === 0 ? 1 : 1 - dist / maxLen
}

// ─── 헬퍼 함수 ─────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.replace(/\s/g, '').toLowerCase()
}

function matchesAny(text: string, keywords: string[]): boolean {
  const norm = normalize(text)
  return keywords.some((k) => norm.includes(normalize(k)))
}

function eulRul(name: string): '을' | '를' {
  const last = name[name.length - 1]
  if (!last) return '을'
  const code = last.charCodeAt(0)
  if (code < 0xac00 || code > 0xd7a3) return '을'
  return (code - 0xac00) % 28 === 0 ? '를' : '을'
}

function stripOrderIntent(transcript: string): string {
  let text = normalize(transcript)
  for (const word of voiceSynonyms.orderIntent) {
    text = text.replaceAll(normalize(word), '')
  }
  text = text.replace(/[일이삼사오육칠팔구십]+(개|잔|그릇|병)?/g, '')
  text = text.replace(/\d+(개|잔)?/g, '')
  text = text.replace(/(을|를|이|가|은|는|으로|로|와|과|랑|이랑|도|만)$/, '')
  return text.trim()
}

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
  if (m) return Math.min(10, parseInt(m[1]!, 10))
  return 1
}

function extractKeyword(transcript: string): string {
  return transcript
    .replace(/있어요|있나요|있나|파나요|되나요|있습니까|있죠|주세요|줘|드릴게요|주문할게요|주문할래요|원해요/g, '')
    .trim()
}

// ─── 메뉴 카탈로그 관리 ─────────────────────────────────────────────────────

/** voiceSynonyms.json 을 MenuEntry[] 형태로 변환한 fallback */
const FALLBACK_MENU_ENTRIES: MenuEntry[] = voiceSynonyms.menus.map((m) => ({
  name: m.name,
  synonyms: m.synonyms,
  isDesert: m.isDesert,
}))

/**
 * Supabase 에서 받아 온 MenuProduct[] 를 음성 인식용 MenuEntry[] 로 변환.
 * - 자동 생성 유사어: 공백 제거 이름 + 공백 분리 단어(2자 이상)
 * - voiceSynonyms.json 에 같은 메뉴가 있으면 수동 유사어를 병합
 */
export function buildMenuEntries(products: MenuProduct[]): MenuEntry[] {
  return products.map((p) => {
    const nameTrimmed = p.name.replace(/\s/g, '')
    const autoSynonyms = [p.name, nameTrimmed, ...p.name.split(/\s+/).filter((w) => w.length >= 2)]

    const staticEntry = voiceSynonyms.menus.find(
      (m) => normalize(m.name) === normalize(p.name),
    )
    const staticSynonyms = staticEntry ? staticEntry.synonyms : []

    const merged = [...new Set([...autoSynonyms, ...staticSynonyms].map(normalize))]

    return {
      name: p.name,
      synonyms: merged,
      isDesert: isDesertProduct(p),
    }
  })
}

// ─── 자모 유사도 기반 메뉴 후보 스코어링 ────────────────────────────────────

/**
 * 발화(transcript)와 메뉴 목록을 비교해 유사도 순으로 정렬된 후보를 반환.
 *
 * ■ 핵심 개선점 — substring 포함 비교(includes)를 제거하고
 *   전체 문자열 자모 유사도로만 판단하므로:
 *     "우베라떼".includes("라떼") = true 에 의한 카페라떼 오매칭 방지
 *     "우배라떼" ↔ "우베라떼" (ㅐ→ㅔ 정규화 후 100%) 정상 매칭
 *
 * ■ 검색 대상: 전체 발화 / 의도 제거 후 / 원문의 개별 단어(공백 분리)
 *   → "아이스 우베라떼 주세요" 에서도 "우베라떼" 단어가 매칭
 */
function scoreMenuCandidates(
  transcript: string,
  menus: MenuEntry[],
): MenuMatchCandidate[] {
  const fullNorm = normalize(transcript)
  const stripped = stripOrderIntent(transcript)

  // 원문의 공백 분리 단어도 개별 비교
  const words = transcript
    .trim()
    .split(/\s+/)
    .map(normalize)
    .filter((w) => w.length >= 2)

  const searchTexts = [...new Set([fullNorm, stripped, ...words].filter(Boolean))]

  const results: MenuMatchCandidate[] = []
  for (const entry of menus) {
    let best = 0
    for (const syn of [entry.name, ...entry.synonyms]) {
      const synNorm = normalize(syn)
      for (const q of searchTexts) {
        const sim = jamoSimilarity(q, synNorm)
        if (sim > best) best = sim
      }
    }
    if (best >= CONFIRM_THRESHOLD) {
      results.push({ entry, similarity: best })
    }
  }
  return results.sort((a, b) => b.similarity - a.similarity)
}

// ─── Disambiguation 로직 ────────────────────────────────────────────────────

/**
 * 여러 후보 중 사용자가 말한 발화로 하나를 특정한다.
 * - 단일 확인 모드(yes/no): 후보가 1개일 때 긍정·부정 응답 처리
 * - 다중 선택 모드: 자모 유사도로 최고 득점 후보 반환 (단, clear winner 필요)
 */
function resolveDisambiguation(
  transcript: string,
  candidates: MenuMatchCandidate[],
  isConfirmMode: boolean,
): { resolved: MenuEntry | null; userSaidNo?: boolean } {
  if (isConfirmMode && candidates.length === 1) {
    const isYes = matchesAny(transcript, ['네', '응', '맞아', '맞아요', '맞습니다', '예', '맞어'])
    const isNo  = matchesAny(transcript, ['아니', '아니요', '아니오', '틀려', '다른거', '아닌데'])
    if (isYes) return { resolved: candidates[0]!.entry }
    if (isNo)  return { resolved: null, userSaidNo: true }
  }

  // 발화를 후보 이름들과 자모 유사도 비교
  const scored = candidates.map((c) => ({
    c,
    sim: jamoSimilarity(normalize(transcript), normalize(c.entry.name)),
  }))
  scored.sort((a, b) => b.sim - a.sim)

  const top = scored[0]
  const second = scored[1]

  if (top && top.sim >= CONFIRM_THRESHOLD) {
    if (!second || top.sim - second.sim >= 0.15) {
      return { resolved: top.c.entry }
    }
  }

  return { resolved: null }
}

// ─── 메인 매칭 함수 ─────────────────────────────────────────────────────────

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
      // ── ① Intent 판별 — 메뉴 매칭보다 항상 먼저 실행 ──────────────────
      // 여기에 새 음성 명령(Intent)을 추가하면 메뉴 검색보다 우선 처리됨.

      // 주문 확정 Intent → 주문 확인 화면 이동
      if (matchesAny(transcript, voiceSynonyms.order.start)) {
        return {
          aiResponse: '주문 내역을 확인해 드릴게요.',
          nextStep: 'STEP4_CONFIRM',
        }
      }

      // ── ② 메뉴 매칭 (Intent에 해당하지 않는 발화에만 실행) ────────────
      const isQuestion = matchesAny(transcript, voiceSynonyms.questions.existence)
      const qty = extractQuantity(transcript)

      const buildMenuEvent = (entry: MenuEntry): VoiceAIEvent => {
        if (isQuestion) {
          return {
            aiResponse: `네, ${entry.name} 있습니다. 장바구니에 담아드릴게요.`,
            action: { type: 'ADD_CART', payload: { menuName: entry.name, count: qty } },
            nextStep: 'STEP3_OPTION_SELECT',
          }
        }
        const response = entry.isDesert
          ? `${entry.name}${eulRul(entry.name)} 장바구니에 담았습니다. 추가로 주문하실 메뉴가 있으신가요?`
          : `옵션을 선택해 주세요. 추가 옵션이 필요하신가요?`
        return {
          aiResponse: response,
          action: { type: 'ADD_CART', payload: { menuName: entry.name, count: qty } },
          nextStep: 'STEP3_OPTION_SELECT',
        }
      }

      // ── 자모 유사도 스코어링 ──
      const candidates = scoreMenuCandidates(transcript, menus)

      // 디버그 로그
      console.group(`[STT] 📝 "${transcript}"`)
      if (candidates.length > 0) {
        console.log(
          '후보:',
          candidates.map((c) => `${c.entry.name} ${Math.round(c.similarity * 100)}%`).join(' / '),
        )
      } else {
        console.log('후보: 없음')
      }

      if (candidates.length === 0) {
        console.log('선택: 매칭 없음')
        console.groupEnd()

        if (isQuestion || transcript.length >= 2) {
          const keyword = extractKeyword(transcript)
          if (keyword) {
            return {
              aiResponse: `죄송합니다, ${keyword} 관련 메뉴가 현재 준비되어 있지 않습니다. 다른 메뉴를 말씀해 주세요.`,
            }
          }
        }
        return null
      }

      const top = candidates[0]!
      const topScore = top.similarity

      // 최고 점수 동률 후보 전체 수집
      const topTied = candidates.filter((c) => Math.abs(c.similarity - topScore) < 0.001)

      if (topScore >= AUTO_SELECT_THRESHOLD && topTied.length === 1) {
        // 단독 1위이면서 임계값 이상 → 자동 선택
        console.log(`선택: 자동 선택 (${Math.round(topScore * 100)}%)`)
        console.groupEnd()
        return buildMenuEvent(top.entry)
      }

      if (topScore >= AUTO_SELECT_THRESHOLD && topTied.length > 1) {
        // 동률 복수 → 무조건 사용자 선택 요청 (점수가 아무리 높아도 불가)
        const names = topTied.map((c) => c.entry.name).join(', ')
        console.log(`선택: 동률 다중 후보 선택 요청 (${Math.round(topScore * 100)}% × ${topTied.length}개)`)
        console.groupEnd()
        return {
          aiResponse: `${names} 중에서 어떤 메뉴를 원하시나요?`,
          __candidates: topTied,
        }
      }

      // 65~89%: 단독 1위이면 yes/no 확인, 그렇지 않으면 선택지 제시
      const isConfirmMode =
        topTied.length === 1 && (candidates.length === 1 || topScore - (candidates[1]?.similarity ?? 0) >= 0.15)
      if (isConfirmMode) {
        console.log(`선택: 단일 후보 확인 요청 (${Math.round(topScore * 100)}%)`)
        console.groupEnd()
        return {
          aiResponse: `혹시 ${top.entry.name}${eulRul(top.entry.name)} 말씀하셨나요?`,
          __candidates: [top],
        }
      }

      // 여러 후보가 비슷한 점수 (동률 포함)
      const topFew = candidates.slice(0, 3)
      const names = topFew.map((c) => c.entry.name).join(', ')
      console.log(`선택: 다중 후보 선택 요청 (상위 ${topFew.length}개)`)
      console.groupEnd()
      return {
        aiResponse: `${names} 중에서 어떤 메뉴를 원하시나요?`,
        __candidates: topFew,
      }
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
        const labels: Record<string, string> = {
          MOBILE: '모바일 페이', COUPON: '쿠폰', DISCOUNT: '할인 수단', APP_CARD: '앱 카드', CARD: '신용카드',
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
  onEvent,
  onListeningChange,
  onTranscriptChange,
  menuProducts,
}: {
  currentStep: VoiceAIStep
  cartSummary?: string
  onEvent: (event: VoiceAIEvent) => void
  onListeningChange?: (listening: boolean) => void
  onTranscriptChange?: (transcript: string) => void
  /** Supabase 에서 받아 온 최신 메뉴 목록. 없으면 voiceSynonyms.json 사용 */
  menuProducts?: MenuProduct[]
}) {
  const stateRef = useRef({
    currentStep,
    onEvent,
    onListeningChange,
    onTranscriptChange,
    menuProducts,
    isProcessing: false,
    // ── Disambiguation 상태 ──
    pendingCandidates: null as MenuMatchCandidate[] | null,
    pendingQty: 1,
    pendingIsConfirmMode: false,
    pendingAttempts: 0,
    pendingTimeout: null as ReturnType<typeof setTimeout> | null,
  })
  stateRef.current.currentStep = currentStep
  stateRef.current.onEvent = onEvent
  stateRef.current.onListeningChange = onListeningChange
  stateRef.current.onTranscriptChange = onTranscriptChange
  stateRef.current.menuProducts = menuProducts

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

    const state = stateRef.current

    const setListening = (v: boolean) => state.onListeningChange?.(v)
    const setTranscript = (t: string) => state.onTranscriptChange?.(t)

    function getActiveMenuEntries(): MenuEntry[] {
      const products = state.menuProducts
      if (products && products.length > 0) return buildMenuEntries(products)
      return FALLBACK_MENU_ENTRIES
    }

    function clearDisambiguationState() {
      if (state.pendingTimeout !== null) {
        clearTimeout(state.pendingTimeout)
        state.pendingTimeout = null
      }
      state.pendingCandidates = null
      state.pendingQty = 1
      state.pendingIsConfirmMode = false
      state.pendingAttempts = 0
    }

    function fireEvent(ev: VoiceAIEvent) {
      ttsInProgress = true
      speak(ev.aiResponse, () => {
        ttsInProgress = false
        state.isProcessing = false
        setListening(true)
      })
      state.onEvent(ev)
    }

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
      const last = event.results[event.results.length - 1]!
      const transcript = last[0]!.transcript.trim()

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
      console.log('[STT] 🎤 최종 발화:', transcript)

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

      // ── Disambiguation 세션 중 ──────────────────────────────────────────
      if (state.pendingCandidates !== null) {
        // 전역 명령(직원 호출, 취소 등)은 disambiguation 중에도 동작
        const globalEvent = matchTranscript(transcript, 'STEP1_GREETING', getActiveMenuEntries())
        if (globalEvent?.action?.type === 'CALL_STAFF' || globalEvent?.action?.type === 'GO_HOME') {
          clearDisambiguationState()
          fireEvent(globalEvent)
          return
        }

        const { resolved, userSaidNo } = resolveDisambiguation(
          transcript,
          state.pendingCandidates,
          state.pendingIsConfirmMode,
        )

        if (resolved) {
          const qty = state.pendingQty
          clearDisambiguationState()
          const ev: VoiceAIEvent = resolved.isDesert
            ? {
                aiResponse: `${resolved.name}${eulRul(resolved.name)} 장바구니에 담았습니다. 추가로 주문하실 메뉴가 있으신가요?`,
                action: { type: 'ADD_CART', payload: { menuName: resolved.name, count: qty } },
                nextStep: 'STEP3_OPTION_SELECT',
              }
            : {
                aiResponse: `옵션을 선택해 주세요. 추가 옵션이 필요하신가요?`,
                action: { type: 'ADD_CART', payload: { menuName: resolved.name, count: qty } },
                nextStep: 'STEP3_OPTION_SELECT',
              }
          fireEvent(ev)
          return
        }

        if (userSaidNo) {
          clearDisambiguationState()
          fireEvent({ aiResponse: '알겠습니다. 원하시는 메뉴를 다시 말씀해 주세요.' })
          return
        }

        // 특정 실패 — 재시도
        state.pendingAttempts++
        if (state.pendingAttempts >= MAX_DISAMBIG_ATTEMPTS) {
          clearDisambiguationState()
          fireEvent({ aiResponse: '죄송합니다. 원하시는 메뉴를 다시 처음부터 말씀해 주세요.' })
        } else {
          const names = state.pendingCandidates.map((c) => c.entry.name).join(', ')
          const ev: VoiceAIEvent = state.pendingIsConfirmMode
            ? { aiResponse: `${state.pendingCandidates[0]!.entry.name}${eulRul(state.pendingCandidates[0]!.entry.name)} 맞으신가요? 네/아니오로 답해 주세요.` }
            : { aiResponse: `다시 여쭤볼게요. ${names} 중 어떤 메뉴인가요?` }
          fireEvent(ev)
        }
        return
      }

      // ── 일반 매칭 ──────────────────────────────────────────────────────
      const menus = getActiveMenuEntries()
      const matched = matchTranscript(transcript, state.currentStep, menus) as InternalVoiceEvent | null

      if (matched?.__candidates) {
        const candidates = matched.__candidates
        const isConfirmMode = candidates.length === 1

        state.pendingCandidates = candidates
        state.pendingQty = extractQuantity(transcript)
        state.pendingIsConfirmMode = isConfirmMode
        state.pendingAttempts = 0

        state.pendingTimeout = setTimeout(() => {
          clearDisambiguationState()
          state.isProcessing = false
          setListening(true)
        }, DISAMBIG_TIMEOUT_MS)

        fireEvent({ aiResponse: matched.aiResponse })
      } else if (matched) {
        fireEvent(matched)
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
      clearDisambiguationState()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
