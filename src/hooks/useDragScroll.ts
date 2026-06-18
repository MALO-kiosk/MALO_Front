import { type RefObject, useEffect } from 'react'

const DRAG_THRESHOLD_PX = 5  // 이 값 이상 움직여야 드래그로 인식 (탭과 구분)

export function useDragScroll(scrollRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!scrollRef.current) return
    const el: HTMLElement = scrollRef.current

    let isDown = false
    let startY = 0
    let startScrollTop = 0
    let isDragging = false

    function getScale() {
      const rect = el.getBoundingClientRect()
      return rect.height > 0 ? el.clientHeight / rect.height : 1
    }

    function onMouseDown(e: MouseEvent) {
      isDown = true
      isDragging = false
      startY = e.clientY
      startScrollTop = el.scrollTop
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDown) return
      const deltaY = e.clientY - startY
      if (!isDragging && Math.abs(deltaY) > DRAG_THRESHOLD_PX) {
        isDragging = true
        el.style.cursor = 'grabbing'
        el.style.userSelect = 'none'
      }
      if (isDragging) {
        el.scrollTop = startScrollTop - deltaY * getScale()
      }
    }

    function onMouseUp() {
      if (!isDown) return
      isDown = false
      if (isDragging) {
        isDragging = false
        el.style.cursor = ''
        el.style.userSelect = ''
        // 드래그 후 mouseup 직후 발생하는 click 이벤트 흡수 (카드 오작동 방지)
        const absorbClick = (e: Event) => {
          e.stopPropagation()
          window.removeEventListener('click', absorbClick, true)
        }
        window.addEventListener('click', absorbClick, true)
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [scrollRef])
}
