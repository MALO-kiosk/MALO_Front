import lineIcon from '@/assets/icons/line_icon.svg'
import './OrderTotalBar.css'

export type OrderTotalBarProps = {
  /** 백엔드 연동 전까지 기본값 1 */
  totalCount?: number
  /** 표시 가격 문자열 (백엔드 연동 시 교체) */
  totalPrice?: string
  /** 주문하기 클릭 시 (백엔드 연동 시) */
  onOrder?: () => void
}

export function OrderTotalBar({
  totalCount = 1,
  totalPrice = '3,700',
  onOrder,
}: OrderTotalBarProps) {
  return (
    <div className="order-total-bar">
      <div className="order-total-bar__grey">
        <div className="order-total-bar__inner">
          <span className="order-total-bar__label">총수량</span>
          <span className="order-total-bar__count">{totalCount}</span>
          <span className="order-total-bar__unit">개</span>
          <img
            src={lineIcon}
            alt=""
            className="order-total-bar__line"
            width={1}
            height={80}
          />
          <span className="order-total-bar__total-wrap">
            <span className="order-total-bar__total-label">합계</span>
            <span className="order-total-bar__price">{totalPrice}</span>
          </span>
        </div>
      </div>
      <button
        type="button"
        className="order-total-bar__submit"
        aria-label="주문하기"
        onClick={() => onOrder?.()}
      >
        주문하기
      </button>
    </div>
  )
}
