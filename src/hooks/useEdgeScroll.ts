import { type RefObject, useEffect } from 'react'

/** 화면 상·하단 가장자리에 커서가 머물 때 자동 스크롤하는 훅 */

const SCROLL_SPEED_PX_PER_SEC = 250  // 시각적 px 기준 초당 스크롤 속도
const EDGE_THRESHOLD_RATIO = 0.15    // 상·하단 트리거 영역 (요소 높이의 15%)
const TRIGGER_DELAY_MS = 500         // 스크롤 시작까지의 대기 시간 (ms)

export function useEdgeScroll(scrollRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let currentZone: 'top' | 'bottom' | null = null
    let triggerTimer: ReturnType<typeof setTimeout> | null = null
    let rafId: number | null = null
    let lastTimestamp: number | null = null

    function stopScrollLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      lastTimestamp = null
    }

    function startScrollLoop(zone: 'top' | 'bottom') {
      function tick(now: number) {
        const target = scrollRef.current
        if (!target || currentZone !== zone) return

        if (lastTimestamp !== null) {
          const elapsed = (now - lastTimestamp) / 1000
          const rect = target.getBoundingClientRect()
          // CSS transform scale 보정: clientHeight(레이아웃px) / rect.height(시각적px)
          const scale = rect.height > 0 ? target.clientHeight / rect.height : 1
          const layoutDelta = SCROLL_SPEED_PX_PER_SEC * elapsed * scale

          if (zone === 'top') {
            target.scrollTop = Math.max(0, target.scrollTop - layoutDelta)
            if (target.scrollTop <= 0) {
              stopScrollLoop()
              return
            }
          } else {
            const maxScroll = target.scrollHeight - target.clientHeight
            target.scrollTop = Math.min(maxScroll, target.scrollTop + layoutDelta)
            if (target.scrollTop >= maxScroll) {
              stopScrollLoop()
              return
            }
          }
        }

        lastTimestamp = now
        rafId = requestAnimationFrame(tick)
      }

      lastTimestamp = null
      rafId = requestAnimationFrame(tick)
    }

    function clearTriggerTimer() {
      if (triggerTimer !== null) {
        clearTimeout(triggerTimer)
        triggerTimer = null
      }
    }

    function enterZone(zone: 'top' | 'bottom') {
      if (currentZone === zone) return
      currentZone = zone
      clearTriggerTimer()
      stopScrollLoop()
      triggerTimer = setTimeout(() => startScrollLoop(zone), TRIGGER_DELAY_MS)
    }

    function leaveZone() {
      currentZone = null
      clearTriggerTimer()
      stopScrollLoop()
    }

    function onMouseMove(e: MouseEvent) {
      if (el.scrollHeight <= el.clientHeight) {
        leaveZone()
        return
      }

      const rect = el.getBoundingClientRect()
      const ratio = (e.clientY - rect.top) / rect.height

      if (ratio < EDGE_THRESHOLD_RATIO && el.scrollTop > 0) {
        enterZone('top')
      } else if (
        ratio > 1 - EDGE_THRESHOLD_RATIO &&
        el.scrollTop < el.scrollHeight - el.clientHeight - 1
      ) {
        enterZone('bottom')
      } else {
        leaveZone()
      }
    }

    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', leaveZone)

    return () => {
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', leaveZone)
      clearTriggerTimer()
      stopScrollLoop()
    }
  }, [scrollRef])
}
