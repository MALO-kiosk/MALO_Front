import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { CSSProperties } from 'react'
import minusIcon from '@/assets/icons/minus_icon.svg'
import plusIcon from '@/assets/icons/plus_icon.svg'
import xIcon from '@/assets/icons/x_icon.svg'
import './EasyCartBar.css'

const TRACK_H = 212
const THUMB_H = 123
const THUMB_RANGE = TRACK_H - THUMB_H

export type EasyCartLineItem = {
  id: string
  name: string
  unitPriceWon: number
  /** 맞춤옵션 추가금액 (샷·시럽·펄, 개당) */
  additionalWon: number
  imageSrc: string
  quantity: number
}

export type EasyCartBarProps = {
  items: EasyCartLineItem[]
  /** 수량 +1 */
  onIncrement: (id: string) => void
  /** 수량 −1 (0이 되면 줄 삭제) */
  onDecrement: (id: string) => void
  /** 줄 통째로 제거 */
  onRemoveLine: (id: string) => void
  className?: string
  style?: CSSProperties
}

export function EasyCartBar({
  items,
  onIncrement,
  onDecrement,
  onRemoveLine,
  className,
  style,
}: EasyCartBarProps) {
  const rootClass = className ? `easy-cart-bar ${className}` : 'easy-cart-bar'

  const bodyRef = useRef<HTMLDivElement>(null)
  const [thumbY, setThumbY] = useState(0)
  const [scrollable, setScrollable] = useState(false)
  const dragging = useRef(false)
  const dragStart = useRef({ clientY: 0, scrollTop: 0 })

  const syncThumbFromBody = useCallback(() => {
    const el = bodyRef.current
    if (!el) return
    const maxScroll = el.scrollHeight - el.clientHeight
    const can = maxScroll > 1
    setScrollable(can)
    if (!can) {
      setThumbY(0)
      return
    }
    const ratio = el.scrollTop / maxScroll
    setThumbY(ratio * THUMB_RANGE)
  }, [])

  useLayoutEffect(() => {
    syncThumbFromBody()
  }, [items, syncThumbFromBody])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const ro = new ResizeObserver(() => syncThumbFromBody())
    ro.observe(el)
    return () => ro.disconnect()
  }, [syncThumbFromBody])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const el = bodyRef.current
      if (!el) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 0) return
      const dy = e.clientY - dragStart.current.clientY
      const next =
        dragStart.current.scrollTop + (dy / THUMB_RANGE) * maxScroll
      el.scrollTop = Math.max(0, Math.min(maxScroll, next))
    }

    const onUp = () => {
      dragging.current = false
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onBodyScroll = () => syncThumbFromBody()

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollable) return
    e.preventDefault()
    dragging.current = true
    dragStart.current = {
      clientY: e.clientY,
      scrollTop: bodyRef.current?.scrollTop ?? 0,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  return (
    <aside className={rootClass} style={style} aria-label="장바구니">
      {/** 흰 카트 박스(1080×297) 기준으로 선·목록·스크롤바 좌표 고정 */}
      <div className="easy-cart-bar__surface">
        <hr className="easy-cart-bar__rule" aria-hidden />

        <div
          ref={bodyRef}
          className="easy-cart-bar__body"
          onScroll={onBodyScroll}
        >
          <ul className="easy-cart-bar__list">
            {items.map((item) => (
              <li key={item.id} className="easy-cart-bar__row">
                <div className="easy-cart-bar__lead">
                  <div
                    className="easy-cart-bar__thumb"
                    style={{ backgroundImage: `url(${item.imageSrc})` }}
                    role="img"
                    aria-label={item.name}
                  />
                  <span className="easy-cart-bar__title">{item.name}</span>
                </div>

                <div
                  className="easy-cart-bar__controls"
                  aria-label="수량·금액·삭제"
                >
                  <button
                    type="button"
                    className="easy-cart-bar__icon-btn easy-cart-bar__icon-btn--minus"
                    aria-label={`${item.name} 한 개 빼기`}
                    onClick={() => onDecrement(item.id)}
                  >
                    <img src={minusIcon} alt="" width={54} height={54} />
                  </button>
                  <span className="easy-cart-bar__qty-val">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="easy-cart-bar__icon-btn easy-cart-bar__icon-btn--plus"
                    aria-label={`${item.name} 한 개 더하기`}
                    onClick={() => onIncrement(item.id)}
                  >
                    <img src={plusIcon} alt="" width={51} height={51} />
                  </button>
                  <span className="easy-cart-bar__line-price">
                    {((item.unitPriceWon + item.additionalWon) * item.quantity).toLocaleString('ko-KR')}원
                  </span>
                  <button
                    type="button"
                    className="easy-cart-bar__icon-btn easy-cart-bar__icon-btn--remove"
                    aria-label={`${item.name} 목록에서 삭제`}
                    onClick={() => onRemoveLine(item.id)}
                  >
                    <img src={xIcon} alt="" width={73} height={73} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="easy-cart-bar__scrollbar" aria-hidden>
          <div className="easy-cart-bar__scrollbar-track">
            <div
              className="easy-cart-bar__scrollbar-thumb"
              style={{ transform: `translateY(${thumbY}px)` }}
              onPointerDown={onThumbPointerDown}
              onPointerUp={onThumbPointerUp}
              onPointerCancel={onThumbPointerUp}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
