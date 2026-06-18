import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type DbOptionGroup = { id: number; name: string }
type DbOptionItem  = { id: number; group_id: number; name: string; price: number }

export type OptionItem = { id: number; name: string; price: number }

export type OptionCatalog = {
  pearl:     OptionItem[]      // group "펄"  — 순서대로 pearlQtys[0..2] 에 대응
  sweetness: OptionItem[]      // group "당도"
  shot:      OptionItem | null // group "샷"  — 단가
  syrup:     OptionItem | null // group "시럽" — 단가
}

export const DEFAULT_CATALOG: OptionCatalog = {
  pearl: [
    { id: 1, name: '타피오카펄', price: 500 },
    { id: 2, name: '화이트펄',   price: 500 },
    { id: 3, name: '알로에',     price: 500 },
  ],
  sweetness: [
    { id: 4, name: '더 달게', price: 0 },
    { id: 5, name: '보통',    price: 0 },
    { id: 6, name: '덜 달게', price: 0 },
  ],
  shot:  { id: 7, name: '샷 추가',  price: 500 },
  syrup: { id: 8, name: '시럽 추가', price: 500 },
}

let cachedCatalog: OptionCatalog | null = null

/** 동기 accessor — 로드 전이면 DEFAULT_CATALOG 반환 */
export function getOptionCatalog(): OptionCatalog {
  return cachedCatalog ?? DEFAULT_CATALOG
}

const fetchPromise: Promise<OptionCatalog> = Promise.all([
  supabase.from('option_groups').select('*'),
  supabase.from('option_items').select('*').order('id'),
]).then(([groupsRes, itemsRes]) => {
  if (groupsRes.error || itemsRes.error) return DEFAULT_CATALOG

  const groups = (groupsRes.data ?? []) as DbOptionGroup[]
  const items  = (itemsRes.data  ?? []) as DbOptionItem[]

  const findGroup = (name: string) => groups.find((g) => g.name === name)
  const itemsOf   = (groupId: number | undefined): OptionItem[] =>
    groupId == null
      ? []
      : items.filter((i) => i.group_id === groupId).map(({ id, name, price }) => ({ id, name, price }))

  const catalog: OptionCatalog = {
    pearl:     itemsOf(findGroup('펄')?.id).slice(0, 3).concat(DEFAULT_CATALOG.pearl).slice(0, 3),
    sweetness: itemsOf(findGroup('당도')?.id),
    shot:      itemsOf(findGroup('샷')?.id)[0]  ?? DEFAULT_CATALOG.shot,
    syrup:     itemsOf(findGroup('시럽')?.id)[0] ?? DEFAULT_CATALOG.syrup,
  }

  // pearl 이 DB에 없으면 기본값 전체 사용
  if (catalog.pearl.length === 0) catalog.pearl = DEFAULT_CATALOG.pearl
  if (catalog.sweetness.length === 0) catalog.sweetness = DEFAULT_CATALOG.sweetness

  cachedCatalog = catalog
  return catalog
})

export function useOptionCatalog() {
  const [catalog, setCatalog] = useState<OptionCatalog>(cachedCatalog ?? DEFAULT_CATALOG)
  const [loading, setLoading] = useState(cachedCatalog === null)

  useEffect(() => {
    if (cachedCatalog) return
    fetchPromise
      .then(setCatalog)
      .finally(() => setLoading(false))
  }, [])

  return { catalog, loading }
}
