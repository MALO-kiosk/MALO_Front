import { useEffect, useRef } from 'react'

const IDLE_TIMEOUT_MS = 3 * 60 * 1000  // 홈으로 복귀까지 대기 시간 (ms)

const RESET_EVENTS = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'] as const

/**
 * 일정 시간 동안 사용자 입력이 없으면 onTimeout을 호출한다.
 * enabled가 false이면 타이머를 시작하지 않는다.
 */
export function useIdleTimeout(onTimeout: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    function reset() {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => onTimeoutRef.current(), IDLE_TIMEOUT_MS)
    }

    RESET_EVENTS.forEach((ev) => document.addEventListener(ev, reset, { passive: true }))
    reset()

    return () => {
      RESET_EVENTS.forEach((ev) => document.removeEventListener(ev, reset))
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [enabled])
}
