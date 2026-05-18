import type { OrderLineDraft } from '@/lib/orderLineDraft'
import {
  computeLineTotalWon,
  enrichOrderLineFromCatalog,
  formatOrderOptionLine,
  orderLineDisplayName,
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
  const displayLine = enrichOrderLineFromCatalog(line)
  const menuName = orderLineDisplayName(displayLine)
  const lineTotalWon = computeLineTotalWon(displayLine)
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
        src={displayLine.imageSrc}
        alt={menuName}
        className="first-menu-image"
      />

      <div className="first-order-item-text">
        <p className="first-order-item-name">{menuName}</p>
        <p className="first-order-item-option">{formatOrderOptionLine(displayLine)}</p>
      </div>

      <span className="first-order-item-qty">{displayLine.quantity}개</span>
      <span className="first-order-item-price">{priceLabel}</span>

      <div className="order-divider-line" />

      <div className="summary-line" />
      <span className="total-qty-label">총수량</span>
      <span className="total-qty-value">{displayLine.quantity}개</span>
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
