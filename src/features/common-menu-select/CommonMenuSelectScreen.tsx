import {
  MenuCategoryTabs,
  OrderTotalBar,
  OutlineFrame,
  ProgressBar,
  TopWhitePanel,
} from '@/components/common'
import './CommonMenuSelectScreen.css'

export type CommonMenuSelectScreenProps = {
  /** 처음으로 → 홈 */
  onGoHome?: () => void
}

export function CommonMenuSelectScreen({
  onGoHome,
}: CommonMenuSelectScreenProps) {
  return (
    <div className="common-menu-select">
      <OutlineFrame
        variant="home"
        className="common-menu-select__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="common-menu-select__staff-frame" />
      <TopWhitePanel as="main" autoHeight minHeightPx={287}>
        <MenuCategoryTabs />
      </TopWhitePanel>
      <ProgressBar />
      <OrderTotalBar />
    </div>
  )
}
