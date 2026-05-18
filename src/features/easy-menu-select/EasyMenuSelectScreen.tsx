import { useCallback, useMemo, useState } from 'react'
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
  type MenuCategorySelection,
} from '@/components/common'
import {
  MENU_CATALOG,
  filterMenuByCategory,
  menuProductPriceLabel,
  type MenuProduct,
} from '@/data/menuCatalog'
import './EasyMenuSelectScreen.css'

const COLS = 3
const MAX_ROWS = 2

export type EasyMenuSelectScreenProps = {
  /** 처음으로 → 홈 */
  onGoHome?: () => void
  /** 주문하기 → 장바구니 항목과 함께 다음 단계 */
  onOrder?: (items: EasyCartLineItem[]) => void
}

export function EasyMenuSelectScreen({
  onGoHome,
  onOrder,
}: EasyMenuSelectScreenProps) {
  const [cartItems, setCartItems] = useState<EasyCartLineItem[]>([])
  const [categorySelection, setCategorySelection] =
    useState<MenuCategorySelection>({
      menuCategory: 'recommended',
      coffeeDetail: 'coffee',
    })

  const visibleProducts = useMemo(
    () => filterMenuByCategory(MENU_CATALOG, categorySelection),
    [categorySelection],
  )

  const productRows = useMemo(() => {
    const capped = visibleProducts.slice(0, COLS * MAX_ROWS)
    const rows: MenuProduct[][] = []
    for (let i = 0; i < capped.length; i += COLS) {
      rows.push(capped.slice(i, i + COLS))
    }
    return rows
  }, [visibleProducts])

  const addProductToCart = useCallback((product: MenuProduct) => {
    setCartItems((prev) => {
      const i = prev.findIndex((x) => x.id === product.id)
      if (i === -1) {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            unitPriceWon: product.unitPriceWon,
            imageSrc: product.imageSrc,
            quantity: 1,
          },
        ]
      }
      const next = [...prev]
      next[i] = { ...next[i], quantity: next[i].quantity + 1 }
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
        <MenuCategoryTabs onSelectionChange={setCategorySelection} />
      </TopWhitePanel>
      <div className="easy-menu-select__menu-grid">
        {productRows.map((row, rowIndex) => (
          <div key={rowIndex} className="easy-menu-select__menu-row">
            {row.map((product) => (
              <EasyMenu
                key={product.id}
                name={product.name}
                price={menuProductPriceLabel(product.unitPriceWon)}
                imageSrc={product.imageSrc}
                onSelect={() => addProductToCart(product)}
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
        onOrder={() => {
          if (cartItems.length === 0) return
          onOrder?.(cartItems)
        }}
      />
    </div>
  )
}
