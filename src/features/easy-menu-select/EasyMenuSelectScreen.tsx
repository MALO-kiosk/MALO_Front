import { useMemo, useState } from 'react'
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
  filterMenuByCategory,
  menuProductPriceLabel,
  type MenuProduct,
} from '@/data/menuCatalog'
import { useMenuCatalog } from '@/lib/useMenuCatalog'
import './EasyMenuSelectScreen.css'

const COLS = 3

export type EasyMenuSelectScreenProps = {
  onGoHome?: () => void
  onStaffCall?: () => void
  cartItems: EasyCartLineItem[]
  onIncrementCart: (id: string) => void
  onDecrementCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  onSelectProduct: (product: MenuProduct) => void
  onOrder?: () => void
  aiMessage?: string
}

export function EasyMenuSelectScreen({
  onGoHome,
  onStaffCall,
  cartItems,
  onIncrementCart,
  onDecrementCart,
  onRemoveFromCart,
  onSelectProduct,
  onOrder,
  aiMessage,
}: EasyMenuSelectScreenProps) {
  const { products } = useMenuCatalog()
  const [categorySelection, setCategorySelection] =
    useState<MenuCategorySelection>({
      menuCategory: 'coffee',
      coffeeDetail: 'drink',
    })

  const visibleProducts = useMemo(
    () => filterMenuByCategory(products, categorySelection),
    [products, categorySelection],
  )

  const productRows = useMemo(() => {
    const rows: MenuProduct[][] = []
    for (let i = 0; i < visibleProducts.length; i += COLS) {
      rows.push(visibleProducts.slice(i, i + COLS))
    }
    return rows
  }, [visibleProducts])

  const totalCount = useMemo(
    () => cartItems.reduce((s, x) => s + x.quantity, 0),
    [cartItems],
  )

  const totalWon = useMemo(
    () => cartItems.reduce((s, x) => s + (x.unitPriceWon + x.additionalWon) * x.quantity, 0),
    [cartItems],
  )

  return (
    <div className="easy-menu-select">
      <OutlineFrame
        variant="home"
        className="easy-menu-select__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame
        variant="staff"
        className="easy-menu-select__staff-frame"
        onStaffCall={onStaffCall}
      />
      <TopWhitePanel as="main" autoHeight minHeightPx={287}>
        <MenuCategoryTabs
          initialActiveId="coffee"
          initialCoffeeDetail="drink"
          onSelectionChange={setCategorySelection}
        />
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
                onSelect={() => onSelectProduct(product)}
              />
            ))}
          </div>
        ))}
      </div>
      <ProgressBar />
      <AISpeechDisplay message={aiMessage} listening={!!aiMessage} />
      <EasyCartBar
        items={cartItems}
        onIncrement={onIncrementCart}
        onDecrement={onDecrementCart}
        onRemoveLine={onRemoveFromCart}
      />
      <OrderTotalBar
        totalCount={totalCount}
        totalPrice={totalWon.toLocaleString('ko-KR')}
        onOrder={() => {
          if (cartItems.length === 0) return
          onOrder?.()
        }}
      />
    </div>
  )
}
