import minusIcon from '@/assets/icons/minus_icon.svg'
import plusIcon from '@/assets/icons/plus_icon.svg'
import xIcon from '@/assets/icons/x_icon.svg'
import type { EasyCartLineItem } from '@/components/common'
import './CommonMenuBottomCartRow.css'

export type CommonMenuBottomCartRowProps = {
  item: EasyCartLineItem
  onIncrement: () => void
  onDecrement: () => void
  onRemoveLine: () => void
}

export function CommonMenuBottomCartRow({
  item,
  onIncrement,
  onDecrement,
  onRemoveLine,
}: CommonMenuBottomCartRowProps) {
  const lineTotalWon = (item.unitPriceWon + item.additionalWon) * item.quantity

  return (
    <div
      className="common-menu-bottom-cart-row"
      role="group"
      aria-label={`${item.name} 장바구니`}
    >
      <div
        className="common-menu-bottom-cart-row__thumb"
        style={{ backgroundImage: `url(${item.imageSrc})` }}
        aria-hidden
      />
      <p className="common-menu-bottom-cart-row__name">{item.name}</p>
      <button
        type="button"
        className="common-menu-bottom-cart-row__icon-btn common-menu-bottom-cart-row__icon-btn--minus"
        aria-label={`${item.name} 한 개 빼기`}
        onClick={onDecrement}
      >
        <img src={minusIcon} alt="" />
      </button>
      <span className="common-menu-bottom-cart-row__qty">{item.quantity}</span>
      <button
        type="button"
        className="common-menu-bottom-cart-row__icon-btn common-menu-bottom-cart-row__icon-btn--plus"
        aria-label={`${item.name} 한 개 더하기`}
        onClick={onIncrement}
      >
        <img src={plusIcon} alt="" />
      </button>
      <p className="common-menu-bottom-cart-row__line-price">
        {lineTotalWon.toLocaleString('ko-KR')}원
      </p>
      <button
        type="button"
        className="common-menu-bottom-cart-row__btn-remove"
        aria-label={`${item.name} 목록에서 삭제`}
        onClick={onRemoveLine}
      >
        <img src={xIcon} alt="" />
      </button>
    </div>
  )
}
