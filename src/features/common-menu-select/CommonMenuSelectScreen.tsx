import { useMemo, useState } from 'react'
import {
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
import { CommonMenuBottomCartRow } from './CommonMenuBottomCartRow'
import { CommonMenuBottomPanel } from './CommonMenuBottomPanel'
import { CommonMenuProductCard } from './CommonMenuProductCard'
import './CommonMenuSelectScreen.css'

const COLS = 4

export type CommonMenuSelectScreenProps = {
  onGoHome?: () => void
  onStaffCall?: () => void
  /** App.tsx에서 관리하는 카트 항목 목록 */
  cartLines: EasyCartLineItem[]
  onIncrementCart: (id: string) => void
  onDecrementCart: (id: string) => void
  onRemoveFromCart: (id: string) => void
  onSelectProduct: (product: MenuProduct) => void
  onOrder?: () => void
}

export function CommonMenuSelectScreen({
  onGoHome,
  onStaffCall,
  cartLines,
  onIncrementCart,
  onDecrementCart,
  onRemoveFromCart,
  onSelectProduct,
  onOrder,
}: CommonMenuSelectScreenProps) {
  const { products } = useMenuCatalog()
  const [categorySelection, setCategorySelection] =
    useState<MenuCategorySelection>({
      menuCategory: 'recommended',
      coffeeDetail: 'coffee',
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
    () => cartLines.reduce((s, x) => s + x.quantity, 0),
    [cartLines],
  )

  const totalPriceLabel = useMemo(() => {
    const total = cartLines.reduce(
      (s, x) => s + (x.unitPriceWon + x.additionalWon) * x.quantity,
      0,
    )
    return total.toLocaleString('ko-KR')
  }, [cartLines])

  return (
    <div className="common-menu-select">
      <OutlineFrame
        variant="home"
        className="common-menu-select__back-frame"
        onHomeClick={onGoHome}
      />
      <OutlineFrame
        variant="staff"
        className="common-menu-select__staff-frame"
        onStaffCall={onStaffCall}
      />
      <TopWhitePanel as="main" autoHeight minHeightPx={287}>
        <MenuCategoryTabs onSelectionChange={setCategorySelection} />
      </TopWhitePanel>
      <div className="common-menu-select__product-grid">
        {productRows.map((row, rowIndex) => (
          <div key={rowIndex} className="common-menu-select__product-row">
            {row.map((product) => (
              <CommonMenuProductCard
                key={product.id}
                imageSrc={product.imageSrc}
                name={product.name}
                priceLabel={menuProductPriceLabel(product.unitPriceWon)}
                onSelect={() => onSelectProduct(product)}
              />
            ))}
          </div>
        ))}
      </div>
      <ProgressBar />
      <CommonMenuBottomPanel>
        {cartLines.map((line) => (
          <CommonMenuBottomCartRow
            key={line.id}
            item={line}
            onIncrement={() => onIncrementCart(line.id)}
            onDecrement={() => onDecrementCart(line.id)}
            onRemoveLine={() => onRemoveFromCart(line.id)}
          />
        ))}
      </CommonMenuBottomPanel>
      <OrderTotalBar
        totalCount={totalCount}
        totalPrice={totalPriceLabel}
        onOrder={() => {
          if (cartLines.length === 0) return
          onOrder?.()
        }}
      />
    </div>
  )
}
