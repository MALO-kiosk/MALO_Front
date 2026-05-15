import { useCallback, useMemo, useState } from 'react'
import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import {
  AISpeechDisplay,
  EasyCartBar,
  EasyMenu,
  MenuCategoryTabs,
  OrderTotalBar,
  OutlineFrame,
  ProgressBar,
  TopWhitePanel,
  type EasyCartLineItem,
} from '@/components/common'
import './EasyMenuSelectScreen.css'

const MENU_STRAWBERRY = {
  id: 'strawberry-matcha',
  name: '스트로베리말차',
  unitPriceWon: 3900,
  imageSrc: menuStrawberryImg,
}

export type EasyMenuSelectScreenProps = {
  /** 처음으로 → 홈 */
  onGoHome?: () => void
  /** 주문하기 → 다음 단계 */
  onOrder?: () => void
}

export function EasyMenuSelectScreen({
  onGoHome,
  onOrder,
}: EasyMenuSelectScreenProps) {
  const [cartItems, setCartItems] = useState<EasyCartLineItem[]>([])

  const addStrawberryToCart = useCallback(() => {
    setCartItems((prev) => {
      const i = prev.findIndex((x) => x.id === MENU_STRAWBERRY.id)
      if (i === -1) {
        return [...prev, { ...MENU_STRAWBERRY, quantity: 1 }]
      }
      const next = [...prev]
      next[i] = {
        ...next[i],
        quantity: next[i].quantity + 1,
      }
      return next
    })
  }, [])

  const handleIncrement = useCallback((id: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    )
  }, [])

  const handleDecrement = useCallback((id: string) => {
    setCartItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== id) return [item]
        if (item.quantity <= 1) return []
        return [{ ...item, quantity: item.quantity - 1 }]
      }),
    )
  }, [])

  const handleRemoveLine = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const totalCount = useMemo(
    () => cartItems.reduce((s, x) => s + x.quantity, 0),
    [cartItems],
  )

  const totalWon = useMemo(
    () =>
      cartItems.reduce(
        (s, x) => s + x.unitPriceWon * x.quantity,
        0,
      ),
    [cartItems],
  )

  const totalPriceLabel = totalWon.toLocaleString('ko-KR')

  return (
    <div className="easy-menu-select">
      <OutlineFrame
        variant="home"
        className="easy-menu-select__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame variant="staff" className="easy-menu-select__staff-frame" />
      <TopWhitePanel as="main" autoHeight minHeightPx={287}>
        <MenuCategoryTabs />
      </TopWhitePanel>
      <div className="easy-menu-select__menu-grid">
        {Array.from({ length: 2 }, (_, row) => (
          <div key={row} className="easy-menu-select__menu-row">
            {Array.from({ length: 3 }, (_, i) => (
              <EasyMenu
                key={`${row}-${i}`}
                onSelect={addStrawberryToCart}
              />
            ))}
          </div>
        ))}
      </div>
      <ProgressBar />
      <AISpeechDisplay />
      <EasyCartBar
        items={cartItems}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemoveLine={handleRemoveLine}
      />
      <OrderTotalBar
        totalCount={totalCount}
        totalPrice={totalPriceLabel}
        onOrder={onOrder}
      />
    </div>
  )
}
