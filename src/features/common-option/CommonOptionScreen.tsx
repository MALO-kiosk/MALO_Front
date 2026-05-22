import {
  EasyCartBarTotal,
  EasyOrderActionBar,
  OutlineFrame,
  TopWhitePanel,
} from '@/components/common'
import { cartSummarySpec } from '@/features/easy-option'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import { computeAdditionalWon } from '@/lib/orderLineDraft'
import './CommonOptionScreen.css'

export type CommonOptionScreenProps = {
  orderLine: OrderLineDraft
  onOrderLineChange: (patch: Partial<OrderLineDraft>) => void
  onGoHome?: () => void
  optionTitle?: string
  onCancelOrder?: () => void
  onAddMenu?: () => void
  /** 맞춤 옵션 버튼 */
  onOpenCustomOption?: () => void
  /** 직원 호출 */
  onStaffCall?: () => void
}

export function CommonOptionScreen({
  orderLine,
  onOrderLineChange,
  onGoHome,
  optionTitle = '옵션',
  onCancelOrder,
  onAddMenu,
  onOpenCustomOption,
  onStaffCall,
}: CommonOptionScreenProps) {
  const { temp, size, cup, isDessert, only_cold } = orderLine

  return (
    <div className="common-option">
      <OutlineFrame
        variant="home"
        className="common-option__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="common-option__staff-frame" onStaffCall={onStaffCall} />
      <TopWhitePanel className="common-option__panel" heightPx={269}>
        <h1 className="common-option__title">{optionTitle}</h1>
      </TopWhitePanel>
      {!isDessert && (
        <>
          <p className="common-option__field-label common-option__field-label--temp">
            온도
          </p>
          <div
            className="common-option__field-row common-option__field-row--temp"
            aria-label="온도 선택"
          >
            <button
              type="button"
              className={`common-option__temp-btn ${temp === 'ice' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={temp === 'ice'}
              onClick={() => onOrderLineChange({ temp: 'ice' })}
            >
              ICE
            </button>
            <button
              type="button"
              className={`common-option__temp-btn ${only_cold ? 'common-option__temp-btn--disabled' : temp === 'hot' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={temp === 'hot'}
              disabled={only_cold}
              onClick={() => onOrderLineChange({ temp: 'hot' })}
            >
              HOT
            </button>
          </div>

          <p className="common-option__field-label common-option__field-label--size">
            사이즈
          </p>
          <div
            className="common-option__field-row common-option__field-row--size"
            aria-label="사이즈 선택"
          >
            <button
              type="button"
              className={`common-option__temp-btn ${size === 'regular' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={size === 'regular'}
              onClick={() => onOrderLineChange({ size: 'regular' })}
            >
              Regular
            </button>
            <button
              type="button"
              className={`common-option__temp-btn ${size === 'large' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={size === 'large'}
              onClick={() => onOrderLineChange({ size: 'large' })}
            >
              Large
            </button>
          </div>

          <p className="common-option__field-label common-option__field-label--cup">
            컵선택
          </p>
          <div
            className="common-option__field-row common-option__field-row--cup"
            aria-label="컵 선택"
          >
            <button
              type="button"
              className={`common-option__temp-btn ${cup === 'mug' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={cup === 'mug'}
              onClick={() => onOrderLineChange({ cup: 'mug' })}
            >
              머그컵
            </button>
            <button
              type="button"
              className={`common-option__temp-btn ${cup === 'personal' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
              aria-pressed={cup === 'personal'}
              onClick={() => onOrderLineChange({ cup: 'personal' })}
            >
              개인컵
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        className="common-option__custom-btn"
        aria-label="맞춤 옵션 화면으로 이동"
        onClick={() => onOpenCustomOption?.()}
      >
        맞춤 옵션
      </button>
      <p className="common-option__custom-hint">
        * 더 상세하게, 내 취향대로! *
      </p>

      <EasyCartBarTotal
        imageSrc={orderLine.imageSrc}
        menuName={orderLine.name}
        menuSpec={cartSummarySpec(temp, size)}
        unitPriceWon={orderLine.unitPriceWon}
        initialQuantity={orderLine.quantity}
        additionalAmountWon={computeAdditionalWon(orderLine)}
      />
      <EasyOrderActionBar onCancel={onCancelOrder} onAddMenu={onAddMenu} />
    </div>
  )
}
