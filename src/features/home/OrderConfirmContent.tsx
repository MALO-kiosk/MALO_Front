import type { OrderLineDraft } from '@/lib/orderLineDraft'
import {
  computeLineTotalWon,
  enrichOrderLineFromCatalog,
  formatOrderOptionLine,
  orderLineDisplayName,
} from '@/lib/orderLineDraft'

type OrderConfirmContentProps = {
  lines: OrderLineDraft[]
  onNext?: () => void
  onPrev?: () => void
}

export function OrderConfirmContent({
  lines,
  onNext,
  onPrev,
}: OrderConfirmContentProps) {
  const displayLines = lines.map(enrichOrderLineFromCatalog)
  const totalQty = displayLines.reduce((s, l) => s + l.quantity, 0)
  const totalWon = displayLines.reduce((s, l) => s + computeLineTotalWon(l), 0)
  const totalPriceLabel = `${totalWon.toLocaleString('ko-KR')}원`

  return (
    <div className="complete-card">
      <h1 className="complete-title">주문 내용을 확인해 주세요!</h1>

      {/* 테이블 헤더 */}
      <div className="oc-header-row">
        <span className="oc-header-menu">메뉴</span>
        <span className="oc-header-qty">수량</span>
        <span className="oc-header-price">금액</span>
      </div>

      {/* 아이템 목록 — 많아지면 스크롤 */}
      <div className="oc-item-list">
        {displayLines.map((line) => {
          const optionText = formatOrderOptionLine(line)
          return (
            <div key={line.id} className="oc-item-row">
              <img
                src={line.imageSrc}
                alt={orderLineDisplayName(line)}
                className="oc-item-row__img"
              />
              <div className="oc-item-row__info">
                <p className="oc-item-row__name">{orderLineDisplayName(line)}</p>
                {optionText && (
                  <p className="oc-item-row__option">{optionText}</p>
                )}
              </div>
              <span className="oc-item-row__qty">{line.quantity}개</span>
              <span className="oc-item-row__price">
                {computeLineTotalWon(line).toLocaleString('ko-KR')} 원
              </span>
            </div>
          )
        })}
      </div>

      {/* 합계 */}
      <div className="oc-divider" />
      <div className="oc-summary">
        <span className="oc-summary__qty-label">총수량</span>
        <span className="oc-summary__qty-value">{totalQty}개</span>
        <span className="oc-summary__price-label">총금액</span>
        <span className="oc-summary__price-value">{totalPriceLabel}</span>
      </div>
      <div className="oc-divider" />

      {/* 버튼 */}
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
