import { useState } from 'react'
import type { CSSProperties } from 'react'
import defaultMenuImage from '@/assets/images/menu_StrawberryMatcha.png'
import minusIcon from '@/assets/icons/minus_icon.svg'
import plusIcon from '@/assets/icons/plus_icon.svg'
import './EasyCartBarTotal.css'

export type EasyCartBarTotalProps = {
  /** 메뉴 썸네일 */
  imageSrc?: string
  /** 메뉴 이름 */
  menuName?: string
  /** 표시 금액 문자열 */
  totalPriceLabel?: string
  /** 초기 수량 */
  initialQuantity?: number
  className?: string
  style?: CSSProperties
}

export function EasyCartBarTotal({
  imageSrc = defaultMenuImage,
  menuName = '스트로베리말차',
  totalPriceLabel = '3,700 원',
  initialQuantity = 1,
  className,
  style,
}: EasyCartBarTotalProps) {
  const [qty, setQty] = useState(initialQuantity)

  const imgUrl = imageSrc ?? defaultMenuImage

  const rootClass = ['easy-cart-bar-total', className].filter(Boolean).join(' ')

  return (
    <aside className={rootClass} style={style} aria-label="선택 메뉴 요약">
      <div className="easy-cart-bar-total__surface">
        <div
          className="easy-cart-bar-total__image"
          style={{ backgroundImage: `url(${imgUrl})` }}
          role="img"
          aria-label={menuName}
        />

        <div className="easy-cart-bar-total__nutrition">
          <span className="easy-cart-bar-total__nutrition-label">
            제품 영양 정보
          </span>
        </div>

        <p className="easy-cart-bar-total__name">{menuName}</p>

        <div className="easy-cart-bar-total__qty">
          <button
            type="button"
            className="easy-cart-bar-total__qty-btn"
            aria-label="한 개 빼기"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <img src={minusIcon} alt="" width={54} height={54} />
          </button>
          <span className="easy-cart-bar-total__qty-val">{qty}</span>
          <button
            type="button"
            className="easy-cart-bar-total__qty-btn"
            aria-label="한 개 더하기"
            onClick={() => setQty((q) => q + 1)}
          >
            <img src={plusIcon} alt="" width={51} height={51} />
          </button>
        </div>
      </div>

      <p className="easy-cart-bar-total__price">{totalPriceLabel}</p>
    </aside>
  )
}
