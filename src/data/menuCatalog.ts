import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import type {
  CoffeeDetailCategoryId,
  EasyCartLineItem,
  MenuCategoryId,
  MenuCategorySelection,
} from '@/components/common'

export type MenuProduct = {
  id: string
  name: string
  imageSrc: string
  unitPriceWon: number
  /** 상위 탭 — 항목당 2개 */
  menuCategories: [MenuCategoryId, MenuCategoryId]
  /** 커피/음료 하위 탭 — 항목당 2개 (커피·음료 상위 탭일 때만 사용) */
  coffeeDetailCategories: [CoffeeDetailCategoryId, CoffeeDetailCategoryId]
}

function product(
  id: string,
  name: string,
  unitPriceWon: number,
  menuCategories: [MenuCategoryId, MenuCategoryId],
  coffeeDetailCategories: [CoffeeDetailCategoryId, CoffeeDetailCategoryId],
): MenuProduct {
  return {
    id,
    name,
    imageSrc: menuStrawberryImg,
    unitPriceWon,
    menuCategories,
    coffeeDetailCategories,
  }
}

/** 더미 메뉴 목록 — API 연동 전, 탭별 필터 검증용 */
export const MENU_CATALOG: MenuProduct[] = [
  product(
    'strawberry-matcha',
    '스트로베리말차',
    3900,
    ['recommended', 'coffee'],
    ['drink', 'tea'],
  ),
  product(
    'peach-frappe',
    '피치 프라페',
    4200,
    ['recommended', 'new'],
    ['drink', 'tea'],
  ),
  product(
    'americano',
    '아메리카노',
    3500,
    ['coffee', 'new'],
    ['coffee', 'decaf'],
  ),
  product(
    'cafe-latte',
    '카페라떼',
    4000,
    ['coffee', 'recommended'],
    ['coffee', 'tea'],
  ),
  product(
    'decaf-latte',
    '디카페인 라떼',
    4300,
    ['coffee', 'new'],
    ['decaf', 'tea'],
  ),
  product(
    'green-grape-ade',
    '청포도 에이드',
    4500,
    ['coffee', 'recommended'],
    ['drink', 'tea'],
  ),
  product(
    'chamomile-tea',
    '캐모마일 티',
    3800,
    ['coffee', 'new'],
    ['tea', 'drink'],
  ),
  product(
    'croissant',
    '버터 크루아상',
    3200,
    ['dessert', 'recommended'],
    ['coffee', 'drink'],
  ),
  product(
    'cheese-cake',
    '뉴욕 치즈케이크',
    4800,
    ['dessert', 'new'],
    ['coffee', 'tea'],
  ),
  product(
    'salt-bread',
    '소금빵',
    2900,
    ['dessert', 'recommended'],
    ['coffee', 'decaf'],
  ),
  product(
    'cold-brew',
    '콜드브루',
    4100,
    ['coffee', 'new'],
    ['coffee', 'drink'],
  ),
  product(
    'yuzu-tea',
    '유자 민트 티',
    3900,
    ['recommended', 'coffee'],
    ['tea', 'drink'],
  ),
]

export function filterMenuByCategory(
  products: MenuProduct[],
  { menuCategory, coffeeDetail }: MenuCategorySelection,
): MenuProduct[] {
  return products.filter((item) => {
    if (!item.menuCategories.includes(menuCategory)) return false
    if (menuCategory === 'coffee') {
      return item.coffeeDetailCategories.includes(coffeeDetail)
    }
    return true
  })
}

export function menuProductPriceLabel(unitPriceWon: number): string {
  return `${unitPriceWon.toLocaleString('ko-KR')}원`
}

export function getMenuProduct(id: string): MenuProduct | undefined {
  return MENU_CATALOG.find((p) => p.id === id)
}

export function menuProductToCartLine(
  product: MenuProduct,
  quantity: number,
): EasyCartLineItem {
  return {
    id: product.id,
    name: product.name,
    unitPriceWon: product.unitPriceWon,
    imageSrc: product.imageSrc,
    quantity,
  }
}
