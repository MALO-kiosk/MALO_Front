import { useState } from 'react'
import {
  EasyCartBarTotal,
  EasyOrderActionBar,
  OutlineFrame,
  TopWhitePanel,
} from '@/components/common'
import './CommonOptionScreen.css'

type TempChoice = 'ice' | 'hot'
type SizeChoice = 'regular' | 'large'
type CupChoice = 'mug' | 'personal'

export type CommonOptionScreenProps = {
  onGoHome?: () => void
  optionTitle?: string
  onCancelOrder?: () => void
  onAddMenu?: () => void
  /** 맞춤 옵션 버튼 */
  onOpenCustomOption?: () => void
}

export function CommonOptionScreen({
  onGoHome,
  optionTitle = '옵션',
  onCancelOrder,
  onAddMenu,
  onOpenCustomOption,
}: CommonOptionScreenProps) {
  const [temp, setTemp] = useState<TempChoice>('ice')
  const [size, setSize] = useState<SizeChoice>('regular')
  const [cup, setCup] = useState<CupChoice>('mug')

  const menuSpecLine = `${temp === 'ice' ? 'ICE' : 'HOT'} / ${size === 'regular' ? 'R' : 'L'}`

  return (
    <div className="common-option">
      <OutlineFrame
        variant="home"
        className="common-option__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="common-option__staff-frame" />
      <TopWhitePanel className="common-option__panel" heightPx={269}>
        <h1 className="common-option__title">{optionTitle}</h1>
      </TopWhitePanel>
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
          onClick={() => setTemp('ice')}
        >
          ICE
        </button>
        <button
          type="button"
          className={`common-option__temp-btn ${temp === 'hot' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
          aria-pressed={temp === 'hot'}
          onClick={() => setTemp('hot')}
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
          onClick={() => setSize('regular')}
        >
          Regular
        </button>
        <button
          type="button"
          className={`common-option__temp-btn ${size === 'large' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
          aria-pressed={size === 'large'}
          onClick={() => setSize('large')}
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
          onClick={() => setCup('mug')}
        >
          머그컵
        </button>
        <button
          type="button"
          className={`common-option__temp-btn ${cup === 'personal' ? 'common-option__temp-btn--selected' : 'common-option__temp-btn--unselected'}`}
          aria-pressed={cup === 'personal'}
          onClick={() => setCup('personal')}
        >
          개인컵
        </button>
      </div>

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

      <EasyCartBarTotal menuSpec={menuSpecLine} />
      <EasyOrderActionBar onCancel={onCancelOrder} onAddMenu={onAddMenu} />
    </div>
  )
}
