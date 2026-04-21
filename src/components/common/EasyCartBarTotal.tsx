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
  /** 온도·사이즈 등 한 줄 요약 (이름 아래 8px) */
  menuSpec?: string
  /** 선택 메뉴 단가(원) — 표시값은 단가 × 수량 */
  unitPriceWon?: number
  /** 초기 수량 */
  initialQuantity?: number
  /** 옵션 등 추가 금액(원) — 표시: +n원 */
  additionalAmountWon?: number
  className?: string
  style?: CSSProperties
}

export function EasyCartBarTotal({
  imageSrc = defaultMenuImage,
  menuName = '스트로베리말차',
  menuSpec = 'ICE / R',
  unitPriceWon = 3900,
  initialQuantity = 1,
  additionalAmountWon = 0,
  className,
  style,
}: EasyCartBarTotalProps) {
  const [qty, setQty] = useState(initialQuantity)

  const imgUrl = imageSrc ?? defaultMenuImage
  const lineTotalWon = unitPriceWon * qty + additionalAmountWon
  const priceDigits = lineTotalWon.toLocaleString('ko-KR')
  const addonDigits = additionalAmountWon.toLocaleString('ko-KR')
  const addonLabel = `추가 금액 +${addonDigits}원`

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
        <p className="easy-cart-bar-total__spec">{menuSpec}</p>

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

        <p className="easy-cart-bar-total__addon-amt" aria-label={addonLabel}>
          {addonLabel}
        </p>

        <div
          className="easy-cart-bar-total__price-row"
          aria-label={`금액 ${priceDigits} 원 (추가 옵션 포함)`}
        >
          <span className="easy-cart-bar-total__amt-label">금액</span>
          <span className="easy-cart-bar-total__amt-num">{priceDigits}</span>
          <span className="easy-cart-bar-total__won">원</span>
        </div>
      </div>
    </aside>
  )
}
