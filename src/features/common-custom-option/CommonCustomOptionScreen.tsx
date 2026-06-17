import { Fragment } from 'react'
import {
  EasyCartBarTotal,
  EasyOrderActionBar,
  OutlineFrame,
  TopWhitePanel,
} from '@/components/common'
import minusIcon from '@/assets/icons/minus_icon.svg'
import plusIcon from '@/assets/icons/plus_icon.svg'
import { cartSummarySpec } from '@/features/easy-option'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import { computeAdditionalWon } from '@/lib/orderLineDraft'
import '@/features/easy-option/EasyOptionScreen.css'
import './CommonCustomOptionScreen.css'

const PEARL_ROW_LABELS = [
  '타피오카펄 + 500원',
  '화이트펄 + 500원',
  '알로에 + 500원',
] as const

const PEARL_ROW_ARIA = ['타피오카 펄', '화이트 펄', '알로에'] as const

export type CommonCustomOptionScreenProps = {
  orderLine: OrderLineDraft
  onOrderLineChange: (patch: Partial<OrderLineDraft>) => void
  onGoHome?: () => void
  panelTitle?: string
  onCancelOrder?: () => void
  onAddMenu?: () => void
  onStaffCall?: () => void
}

export function CommonCustomOptionScreen({
  orderLine,
  onOrderLineChange,
  onGoHome,
  panelTitle = '맞춤 옵션',
  onCancelOrder,
  onAddMenu,
  onStaffCall,
}: CommonCustomOptionScreenProps) {
  const { shotQty, syrupQty, pearlQtys, sweetness, temp, size } = orderLine

  const setPearlQtyRow = (row: number, next: (q: number) => number) => {
    const nextPearlQtys = pearlQtys.map((q, i) =>
      i === row ? next(q) : q,
    ) as OrderLineDraft['pearlQtys']
    onOrderLineChange({ pearlQtys: nextPearlQtys })
  }

  return (
    <div className="easy-option">
      <OutlineFrame
        variant="home"
        className="easy-option__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="easy-option__staff-frame" onStaffCall={onStaffCall} />
      <TopWhitePanel className="easy-option__panel" heightPx={269}>
        <h1 className="easy-option__title">{panelTitle}</h1>
      </TopWhitePanel>

      <p className="common-custom-option__shot-label">샷</p>
      <p className="common-custom-option__shot-addon">샷 추가 +500원</p>

      <div className="common-custom-option__shot-qty" aria-label="샷 수량">
        <button
          type="button"
          className="common-custom-option__shot-qty-btn"
          aria-label="샷 한 개 빼기"
          onClick={() =>
            onOrderLineChange({ shotQty: Math.max(0, shotQty - 1) })
          }
        >
          <img src={minusIcon} alt="" width={54} height={54} />
        </button>
        <span className="common-custom-option__shot-qty-val">{shotQty}</span>
        <button
          type="button"
          className="common-custom-option__shot-qty-btn"
          aria-label="샷 한 개 더하기"
          onClick={() => onOrderLineChange({ shotQty: shotQty + 1 })}
        >
          <img src={plusIcon} alt="" width={51} height={51} />
        </button>
      </div>

      <p className="common-custom-option__syrup-label">시럽</p>
      <p className="common-custom-option__syrup-addon">바닐라 시럽 +500원</p>
      <div className="common-custom-option__syrup-qty" aria-label="바닐라 시럽 수량">
        <button
          type="button"
          className="common-custom-option__shot-qty-btn"
          aria-label="바닐라 시럽 한 스푼 빼기"
          onClick={() =>
            onOrderLineChange({ syrupQty: Math.max(0, syrupQty - 1) })
          }
        >
          <img src={minusIcon} alt="" width={54} height={54} />
        </button>
        <span className="common-custom-option__shot-qty-val">{syrupQty}</span>
        <button
          type="button"
          className="common-custom-option__shot-qty-btn"
          aria-label="바닐라 시럽 한 스푼 더하기"
          onClick={() => onOrderLineChange({ syrupQty: syrupQty + 1 })}
        >
          <img src={plusIcon} alt="" width={51} height={51} />
        </button>
      </div>

      <p className="common-custom-option__sweetness-label">당도</p>

      <button
        type="button"
        className={`common-custom-option__sweetness-pill common-custom-option__sweetness-pill--slot-more ${sweetness === 'more' ? 'common-custom-option__sweetness-pill--selected' : 'common-custom-option__sweetness-pill--unselected'}`}
        aria-pressed={sweetness === 'more'}
        aria-label="더 달게"
        onClick={() => onOrderLineChange({ sweetness: 'more' })}
      >
        <span className="common-custom-option__sweetness-pill-text">더 달게</span>
      </button>
      <button
        type="button"
        className={`common-custom-option__sweetness-pill common-custom-option__sweetness-pill--slot-normal ${sweetness === 'normal' ? 'common-custom-option__sweetness-pill--selected' : 'common-custom-option__sweetness-pill--unselected'}`}
        aria-pressed={sweetness === 'normal'}
        aria-label="보통"
        onClick={() => onOrderLineChange({ sweetness: 'normal' })}
      >
        <span className="common-custom-option__sweetness-pill-text">보통</span>
      </button>
      <button
        type="button"
        className={`common-custom-option__sweetness-pill common-custom-option__sweetness-pill--slot-less ${sweetness === 'less' ? 'common-custom-option__sweetness-pill--selected' : 'common-custom-option__sweetness-pill--unselected'}`}
        aria-pressed={sweetness === 'less'}
        aria-label="덜 달게"
        onClick={() => onOrderLineChange({ sweetness: 'less' })}
      >
        <span className="common-custom-option__sweetness-pill-text common-custom-option__sweetness-pill-text--fluid">
          덜 달게
        </span>
      </button>

      <p className="common-custom-option__pearl-label">펄</p>
      {[0, 1, 2].map((row) => (
        <Fragment key={row}>
          <p
            className={`common-custom-option__pearl-addon common-custom-option__pearl-addon--r${row}`}
          >
            {PEARL_ROW_LABELS[row]}
          </p>
          <div
            className={`common-custom-option__pearl-qty common-custom-option__pearl-qty--r${row}`}
            aria-label={`${PEARL_ROW_ARIA[row]} 수량 ${row + 1}행`}
          >
            <button
              type="button"
              className="common-custom-option__pearl-qty-btn"
              aria-label={`${PEARL_ROW_ARIA[row]} ${row + 1}행 한 개 빼기`}
              onClick={() => setPearlQtyRow(row, (q) => Math.max(0, q - 1))}
            >
              <img src={minusIcon} alt="" width={54} height={54} />
            </button>
            <span className="common-custom-option__pearl-qty-val">
              {pearlQtys[row]}
            </span>
            <button
              type="button"
              className="common-custom-option__pearl-qty-btn"
              aria-label={`${PEARL_ROW_ARIA[row]} ${row + 1}행 한 개 더하기`}
              onClick={() => setPearlQtyRow(row, (q) => q + 1)}
            >
              <img src={plusIcon} alt="" width={51} height={51} />
            </button>
          </div>
        </Fragment>
      ))}

      <EasyCartBarTotal
        imageSrc={orderLine.imageSrc}
        menuName={orderLine.name}
        menuSpec={cartSummarySpec(temp, size)}
        unitPriceWon={orderLine.unitPriceWon}
        initialQuantity={orderLine.quantity}
        additionalAmountWon={computeAdditionalWon(orderLine)}
      />
      <EasyOrderActionBar
        className="easy-order-action-bar--top"
        onCancel={onCancelOrder}
        onAddMenu={() => onAddMenu?.()}
      />
    </div>
  )
}
