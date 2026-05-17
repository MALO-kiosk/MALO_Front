import type { OrderLineDraft } from '@/lib/orderLineDraft'
import {
  computeLineTotalWon,
  formatOrderOptionLine,
} from '@/lib/orderLineDraft'
import cancelIcon from '@/assets/icons/cancel.svg'

type OrderConfirmContentProps = {
  line: OrderLineDraft
  onNext?: () => void
  onPrev?: () => void
}

export function OrderConfirmContent({
  line,
  onNext,
  onPrev,
}: OrderConfirmContentProps) {
  const lineTotalWon = computeLineTotalWon(line)
  const priceLabel = `${lineTotalWon.toLocaleString('ko-KR')} 원`
  const totalLabel = `${lineTotalWon.toLocaleString('ko-KR')}원`

  return (
    <div className="complete-card">
      <h1 className="complete-title">주문 내용을 확인해 주세요!</h1>
      <img src={cancelIcon} alt="cancel" className="cancel-icon" />
      <div className="order-header-bg" />
      <div className="order-header">메뉴</div>
      <div className="header-quantity">수량</div>
      <div className="header-amount">금액</div>

      <img
        src={line.imageSrc}
        alt={line.name}
        className="first-menu-image"
      />

      <p className="first-order-item-name">{line.name}</p>
      <p className="first-order-item-option">{formatOrderOptionLine(line)}</p>

      <span className="first-order-item-qty">{line.quantity}개</span>
      <span className="first-order-item-price">{priceLabel}</span>

      <div className="order-divider-line" />

      <div className="summary-line" />
      <span className="total-qty-label">총수량</span>
      <span className="total-qty-value">{line.quantity}개</span>
      <span className="total-amount-label">총금액은</span>
      <span className="total-amount-value">{totalLabel}</span>
      <div className="summary-line-bottom" />
      <div className="button-group">
        <button type="button" className="no-btn" onClick={onPrev}>
          이전
        </button>
        <button type="button" className="yes-btn" onClick={onNext}>
          결제하기
        </button>
      </div>
    </div>
  )
}
