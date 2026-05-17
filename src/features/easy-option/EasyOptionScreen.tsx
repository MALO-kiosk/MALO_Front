import {
  AISpeechDisplay,
  EasyCartBarTotal,
  EasyOrderActionBar,
  OutlineFrame,
  TopWhitePanel,
} from '@/components/common'
import type { OrderLineDraft } from '@/lib/orderLineDraft'
import { computeAdditionalWon } from '@/lib/orderLineDraft'
import './EasyOptionScreen.css'

type TempChoice = 'ice' | 'hot'
type SizeChoice = 'regular' | 'large'

/** 카트 요약 줄 — 예: ICE / R, HOT / L */
export function cartSummarySpec(temp: TempChoice, size: SizeChoice): string {
  const tempLabel = temp === 'ice' ? 'ICE' : 'HOT'
  const sizeLabel = size === 'regular' ? 'R' : 'L'
  return `${tempLabel} / ${sizeLabel}`
}

export type EasyOptionScreenProps = {
  orderLine: OrderLineDraft
  onOrderLineChange: (patch: Partial<OrderLineDraft>) => void
  /** 처음으로 → 홈 */
  onGoHome?: () => void
  /** 상단 옵션 안내 문구 */
  optionTitle?: string
  /** 주문 취소 */
  onCancelOrder?: () => void
  /** 메뉴 담기 */
  onAddMenu?: () => void
  /** 맞춤 옵션 화면으로 이동 — `easy-option__custom-btn` */
  onOpenCustomOption: () => void
}

export function EasyOptionScreen({
  orderLine,
  onOrderLineChange,
  onGoHome,
  optionTitle = '옵션',
  onCancelOrder,
  onAddMenu,
  onOpenCustomOption,
}: EasyOptionScreenProps) {
  const { temp, size, cup } = orderLine

  return (
    <div className="easy-option">
      <OutlineFrame
        variant="home"
        className="easy-option__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="easy-option__staff-frame" />
      <TopWhitePanel className="easy-option__panel" heightPx={269}>
        <h1 className="easy-option__title">{optionTitle}</h1>
      </TopWhitePanel>
      <p className="easy-option__temp-label">온도</p>
      <div className="easy-option__temp-row" aria-label="온도 선택">
        <button
          type="button"
          className={`easy-option__temp-btn ${temp === 'ice' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={temp === 'ice'}
          onClick={() => onOrderLineChange({ temp: 'ice' })}
        >
          ICE
        </button>
        <button
          type="button"
          className={`easy-option__temp-btn ${temp === 'hot' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={temp === 'hot'}
          onClick={() => onOrderLineChange({ temp: 'hot' })}
        >
          HOT
        </button>
      </div>
      <p className="easy-option__size-label">사이즈</p>
      <div className="easy-option__size-row" aria-label="사이즈 선택">
        <button
          type="button"
          className={`easy-option__temp-btn ${size === 'regular' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={size === 'regular'}
          onClick={() => onOrderLineChange({ size: 'regular' })}
        >
          Regular
        </button>
        <button
          type="button"
          className={`easy-option__temp-btn ${size === 'large' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={size === 'large'}
          onClick={() => onOrderLineChange({ size: 'large' })}
        >
          Large
        </button>
      </div>
      <p className="easy-option__cup-label">컵선택</p>
      <div className="easy-option__cup-row" aria-label="컵 선택">
        <button
          type="button"
          className={`easy-option__temp-btn ${cup === 'mug' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={cup === 'mug'}
          onClick={() => onOrderLineChange({ cup: 'mug' })}
        >
          머그컵
        </button>
        <button
          type="button"
          className={`easy-option__temp-btn ${cup === 'personal' ? 'easy-option__temp-btn--selected' : 'easy-option__temp-btn--unselected'}`}
          aria-pressed={cup === 'personal'}
          onClick={() => onOrderLineChange({ cup: 'personal' })}
        >
          개인컵
        </button>
      </div>
      <button
        type="button"
        className="easy-option__custom-btn"
        onClick={onOpenCustomOption}
        aria-label="맞춤 옵션 화면으로 이동"
      >
        맞춤 옵션
      </button>
      <p className="easy-option__custom-hint">* 더 상세하게, 내 취향대로! *</p>
      <AISpeechDisplay />
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
