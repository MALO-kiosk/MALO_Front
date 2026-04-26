import { useCallback, useMemo, useState } from 'react'
import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import {
  MenuCategoryTabs,
  OrderTotalBar,
  OutlineFrame,
  ProgressBar,
  TopWhitePanel,
  type EasyCartLineItem,
} from '@/components/common'
import { CommonMenuBottomCartRow } from './CommonMenuBottomCartRow'
import { CommonMenuBottomPanel } from './CommonMenuBottomPanel'
import { CommonMenuProductCard } from './CommonMenuProductCard'
import './CommonMenuSelectScreen.css'

const MENU_STRAWBERRY_ID = 'strawberry-matcha'

function strawberryLine(quantity: number): EasyCartLineItem {
  return {
    id: MENU_STRAWBERRY_ID,
    name: '스트로베리말차',
    unitPriceWon: 3900,
    imageSrc: menuStrawberryImg,
    quantity,
  }
}

export type CommonMenuSelectScreenProps = {
  /** 처음으로 → 홈 */
  onGoHome?: () => void
  /** 주문하기 → 옵션 화면 */
  onOrder?: () => void
}

export function CommonMenuSelectScreen({
  onGoHome,
  onOrder,
}: CommonMenuSelectScreenProps) {
  const [cartLine, setCartLine] = useState<EasyCartLineItem | null>(null)

  const handleSelectMenu = useCallback(() => {
    setCartLine((prev) => {
      if (!prev || prev.id !== MENU_STRAWBERRY_ID) {
        return strawberryLine(1)
      }
      return { ...prev, quantity: prev.quantity + 1 }
    })
  }, [])

  const handleIncrement = useCallback(() => {
    setCartLine((prev) =>
      prev ? { ...prev, quantity: prev.quantity + 1 } : null,
    )
  }, [])

  const handleDecrement = useCallback(() => {
    setCartLine((prev) => {
      if (!prev) return null
      if (prev.quantity <= 1) return null
      return { ...prev, quantity: prev.quantity - 1 }
    })
  }, [])

  const handleRemoveLine = useCallback(() => {
    setCartLine(null)
  }, [])

  const totalCount = cartLine?.quantity ?? 0
  const totalPriceLabel = useMemo(() => {
    if (!cartLine) return '0'
    return (cartLine.unitPriceWon * cartLine.quantity).toLocaleString('ko-KR')
  }, [cartLine])

  const handleOrder = useCallback(() => {
    if (!cartLine) return
    onOrder?.()
  }, [cartLine, onOrder])

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
      <CommonMenuProductCard onSelect={handleSelectMenu} />
      <ProgressBar />
      <CommonMenuBottomPanel>
        {cartLine ? (
          <CommonMenuBottomCartRow
            item={cartLine}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemoveLine={handleRemoveLine}
          />
        ) : null}
      </CommonMenuBottomPanel>
      <OrderTotalBar
        totalCount={totalCount}
        totalPrice={totalPriceLabel}
        onOrder={handleOrder}
      />
    </div>
  )
}
