import { useEffect, useState } from 'react'
import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import type { CoffeeDetailCategoryId, MenuCategoryId } from '@/components/common'
import type { MenuProduct } from '@/data/menuCatalog'
import { supabase } from './supabase'

type DbMenuItem = {
  id: string
  name: string
  unit_price_won?: number | null
  price?: string | number | null
  image_url?: string | null
  image?: string | null
  primary_category: string | null
  secondary_category: string | null
  only_cold?: boolean | null
}

const PRIMARY_CATEGORY_MAP: Record<string, MenuCategoryId> = {
  '추천': 'recommended',
  '신메뉴': 'new',
  '커피/음료': 'coffee',
  '디저트': 'dessert',
}

const SECONDARY_CATEGORY_MAP: Record<string, CoffeeDetailCategoryId> = {
  '커피': 'coffee',
  '디카페인 커피': 'decaf',
  '디카페인': 'decaf',
  '음료': 'drink',
  '티/라떼': 'tea',
}

const COFFEE_DETAIL_KEYS = new Set(['커피', '디카페인 커피', '디카페인', '음료', '티/라떼'])

function resolveSecondMenuCategory(primary: string, secondaryRaw: string | null): MenuCategoryId {
  if (primary === '커피/음료') return 'coffee'
  if (primary === '디저트') return 'dessert'
  // 추천 / 신메뉴: secondary_category로 두 번째 탭 결정
  if (COFFEE_DETAIL_KEYS.has(secondaryRaw ?? '')) return 'coffee'
  return 'dessert'
}

function mapDbToProduct(row: DbMenuItem): MenuProduct {
  const primaryCat = PRIMARY_CATEGORY_MAP[row.primary_category ?? ''] ?? 'recommended'
  const secondMenuCat = resolveSecondMenuCategory(row.primary_category ?? '', row.secondary_category)
  const secondaryCat = SECONDARY_CATEGORY_MAP[row.secondary_category ?? ''] ?? 'coffee'
  const rawPrice = row.unit_price_won ?? row.price
  const unitPriceWon = typeof rawPrice === 'string' ? parseInt(rawPrice, 10) || 0 : rawPrice ?? 0

  return {
    id: row.id,
    name: row.name,
    imageSrc: row.image ?? row.image_url ?? menuStrawberryImg,
    unitPriceWon,
    menuCategories: [primaryCat, secondMenuCat],
    coffeeDetailCategories: [secondaryCat, secondaryCat],
    only_cold: row.only_cold ?? false,
  }
}

// 앱 시작 즉시 fetch 시작 (모듈 로드 시점)
let cachedProducts: MenuProduct[] | null = null

const fetchPromise: Promise<MenuProduct[]> = Promise.resolve(
  supabase.from('menu_items').select('*')
).then(({ data, error }) => {
  if (error) throw new Error(error.message)
  cachedProducts = (data ?? []).map(row => mapDbToProduct(row as DbMenuItem))
  return cachedProducts
})

export function useMenuCatalog() {
  const [products, setProducts] = useState<MenuProduct[]>(cachedProducts ?? [])
  const [loading, setLoading] = useState(cachedProducts === null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (cachedProducts) return

    fetchPromise
      .then(setProducts)
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [])

  return { products, loading, error }
}
