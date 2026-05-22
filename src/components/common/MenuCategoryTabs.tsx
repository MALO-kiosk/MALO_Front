import { useState } from 'react'
import './MenuCategoryTabs.css'

export type MenuCategoryId = 'recommended' | 'new' | 'coffee' | 'dessert'

export type CoffeeDetailCategoryId = 'coffee' | 'decaf' | 'drink' | 'tea' | 'dessert'

type TabDef = {
  id: MenuCategoryId
  label: string
  dessertDefault: boolean
  gapBefore: number
}

const TABS: TabDef[] = [
  { id: 'recommended', label: '추천', dessertDefault: false, gapBefore: 0 },
  { id: 'new', label: '신메뉴', dessertDefault: false, gapBefore: 32 },
  { id: 'coffee', label: '커피/음료', dessertDefault: false, gapBefore: 39 },
  { id: 'dessert', label: '디저트', dessertDefault: true, gapBefore: 39 },
]

type CoffeeDetailDef = {
  id: CoffeeDetailCategoryId
  label: string
  gapBefore: number
}

/** 커피/음료 탭용 서브탭 */
const COFFEE_DETAIL_TABS: CoffeeDetailDef[] = [
  { id: 'coffee', label: '커피', gapBefore: 0 },
  { id: 'decaf', label: '디카페인 커피', gapBefore: 39 },
  { id: 'drink', label: '음료', gapBefore: 39 },
  { id: 'tea', label: '티/라떼', gapBefore: 39 },
]

/** 추천 / 신메뉴 탭용 서브탭 (디저트 포함) */
const RECOMMEND_DETAIL_TABS: CoffeeDetailDef[] = [
  { id: 'coffee', label: '커피', gapBefore: 0 },
  { id: 'decaf', label: '디카페인 커피', gapBefore: 39 },
  { id: 'drink', label: '음료', gapBefore: 39 },
  { id: 'tea', label: '티/라떼', gapBefore: 39 },
  { id: 'dessert', label: '디저트', gapBefore: 39 },
]

export type MenuCategorySelection = {
  menuCategory: MenuCategoryId
  coffeeDetail: CoffeeDetailCategoryId
}

export type MenuCategoryTabsProps = {
  className?: string
  initialActiveId?: MenuCategoryId
  initialCoffeeDetail?: CoffeeDetailCategoryId
  onSelectionChange?: (selection: MenuCategorySelection) => void
}

export function MenuCategoryTabs({
  className,
  initialActiveId = 'recommended',
  initialCoffeeDetail = 'coffee',
  onSelectionChange,
}: MenuCategoryTabsProps) {
  const [activeId, setActiveId] = useState<MenuCategoryId>(initialActiveId)
  const [activeCoffeeDetail, setActiveCoffeeDetail] =
    useState<CoffeeDetailCategoryId>(initialCoffeeDetail)

  const emitSelection = (
    menuCategory: MenuCategoryId,
    coffeeDetail: CoffeeDetailCategoryId,
  ) => {
    onSelectionChange?.({ menuCategory, coffeeDetail })
  }

  const selectMenuCategory = (id: MenuCategoryId) => {
    setActiveId(id)
    emitSelection(id, activeCoffeeDetail)
  }

  const selectCoffeeDetail = (id: CoffeeDetailCategoryId) => {
    setActiveCoffeeDetail(id)
    emitSelection(activeId, id)
  }

  const showsDetailTabs =
    activeId === 'coffee' || activeId === 'recommended' || activeId === 'new'
  const detailTabs =
    activeId === 'coffee' ? COFFEE_DETAIL_TABS : RECOMMEND_DETAIL_TABS

  return (
    <div
      className={
        className
          ? `menu-category-section ${className}`
          : 'menu-category-section'
      }
    >
      <div className="menu-category-tabs" role="tablist" aria-label="메뉴 카테고리">
        {TABS.map((tab) => {
          const isActive = activeId === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={[
                'menu-category-tabs__tab',
                isActive && 'menu-category-tabs__tab--active',
                tab.dessertDefault && 'menu-category-tabs__tab--dessert-default',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ marginLeft: tab.gapBefore }}
              onClick={() => selectMenuCategory(tab.id)}
            >
              <span className="menu-category-tabs__label">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {showsDetailTabs && (
        <div
          className="coffee-detail-tabs"
          role="tablist"
          aria-label="상세 카테고리"
        >
          {detailTabs.map((tab) => {
            const isActive = activeCoffeeDetail === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={[
                  'coffee-detail-tabs__btn',
                  isActive && 'coffee-detail-tabs__btn--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ marginLeft: tab.gapBefore }}
                onClick={() => selectCoffeeDetail(tab.id)}
              >
                <span className="coffee-detail-tabs__label">{tab.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
