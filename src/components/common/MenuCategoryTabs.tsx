import { useState } from 'react'
import './MenuCategoryTabs.css'

export type MenuCategoryId = 'recommended' | 'new' | 'coffee' | 'dessert'

export type CoffeeDetailCategoryId = 'coffee' | 'decaf' | 'drink' | 'tea'

type TabDef = {
  id: MenuCategoryId
  label: string
  /** 디저트만 비선택 시 #000 / 400 */
  dessertDefault: boolean
  /** 이 탭 왼쪽 간격(px). 첫 탭은 0 */
  gapBefore: number
}

/** 왼쪽 73px 기준: 추천 →(32)→ 신메뉴 →(39)→ 커피/음료 →(39)→ 디저트 */
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

/** 추천 정렬선 아래 49px — 같은 73px 들여쓰기에서 (39) 간격으로 나열 */
const COFFEE_DETAIL_TABS: CoffeeDetailDef[] = [
  { id: 'coffee', label: '커피', gapBefore: 0 },
  { id: 'decaf', label: '디카페인 커피', gapBefore: 39 },
  { id: 'drink', label: '음료', gapBefore: 39 },
  { id: 'tea', label: '티/라떼', gapBefore: 39 },
]

export type MenuCategoryTabsProps = {
  className?: string
  initialActiveId?: MenuCategoryId
}

export function MenuCategoryTabs({
  className,
  initialActiveId = 'coffee',
}: MenuCategoryTabsProps) {
  const [activeId, setActiveId] = useState<MenuCategoryId>(initialActiveId)
  const [activeCoffeeDetail, setActiveCoffeeDetail] =
    useState<CoffeeDetailCategoryId>('coffee')

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
              onClick={() => setActiveId(tab.id)}
            >
              <span className="menu-category-tabs__label">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeId === 'coffee' ? (
        <div
          className="coffee-detail-tabs"
          role="tablist"
          aria-label="커피·음료 상세 카테고리"
        >
          {COFFEE_DETAIL_TABS.map((tab) => {
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
                onClick={() => setActiveCoffeeDetail(tab.id)}
              >
                <span className="coffee-detail-tabs__label">{tab.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
