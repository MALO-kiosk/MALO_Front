import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import type { EasyCartLineItem } from '@/components/common'
import { getMenuProduct, isDesertProduct, type MenuProduct } from '@/data/menuCatalog'
import { getOptionCatalog } from '@/lib/useOptionCatalog'

export type TempChoice = 'ice' | 'hot'
export type SizeChoice = 'regular' | 'large'
export type CupChoice = 'mug' | 'personal'
export type SweetnessChoice = 'more' | 'normal' | 'less'

export type OrderLineDraft = {
  /** 메뉴 상품 ID (e.g. 'strawberry-matcha') */
  id: string
  /** 장바구니 줄 고유 ID — 같은 메뉴를 다른 옵션으로 담으면 서로 다른 값 */
  lineId: string
  name: string
  imageSrc: string
  unitPriceWon: number
  quantity: number
  isDessert: boolean
  only_cold: boolean
  temp: TempChoice
  size: SizeChoice
  cup: CupChoice
  sweetness: SweetnessChoice
  shotQty: number
  syrupQty: number
  pearlQtys: [number, number, number]
}

export const CUSTOM_OPTION_UNIT_WON = 500

const PEARL_DISPLAY_NAMES = ['타피오카펄', '화이트펄', '알로에'] as const

const SWEETNESS_LABEL: Record<SweetnessChoice, string> = {
  more: '더 달게',
  normal: '보통',
  less: '덜 달게',
}

let _lineIdSeq = 0
function newLineId(): string {
  return `line-${Date.now()}-${++_lineIdSeq}`
}

export function createDefaultOrderLineDraft(): OrderLineDraft {
  return {
    id: 'strawberry-matcha',
    lineId: newLineId(),
    name: '스트로베리말차',
    imageSrc: menuStrawberryImg,
    unitPriceWon: 3900,
    quantity: 1,
    isDessert: false,
    only_cold: false,
    temp: 'ice',
    size: 'regular',
    cup: 'mug',
    sweetness: 'more',
    shotQty: 0,
    syrupQty: 0,
    pearlQtys: [0, 0, 0],
  }
}

export function orderLineFromCartItem(item: EasyCartLineItem): OrderLineDraft {
  const product = getMenuProduct(item.id)
  return {
    ...createDefaultOrderLineDraft(),
    id: item.id,
    name: product?.name ?? item.name,
    imageSrc: product?.imageSrc ?? item.imageSrc,
    unitPriceWon: product?.unitPriceWon ?? item.unitPriceWon,
    quantity: item.quantity,
    isDessert: product ? isDesertProduct(product) : false,
  }
}

export function orderLineFromProduct(product: MenuProduct): OrderLineDraft {
  return {
    ...createDefaultOrderLineDraft(),
    id: product.id,
    lineId: newLineId(),
    name: product.name,
    imageSrc: product.imageSrc,
    unitPriceWon: product.unitPriceWon,
    isDessert: isDesertProduct(product),
    only_cold: product.only_cold,
    temp: product.only_cold ? 'ice' : 'ice',
  }
}

export function orderLineDraftToCartItem(line: OrderLineDraft): EasyCartLineItem {
  return {
    id: line.lineId,
    name: line.name,
    unitPriceWon: line.unitPriceWon,
    additionalWon: computeAdditionalWon(line),
    imageSrc: line.imageSrc,
    quantity: line.quantity,
  }
}

/** 두 드래프트가 같은 메뉴 + 같은 옵션이면 true (수량 제외) */
export function orderLineDraftsMatch(a: OrderLineDraft, b: OrderLineDraft): boolean {
  return (
    a.id === b.id &&
    a.temp === b.temp &&
    a.size === b.size &&
    a.cup === b.cup &&
    a.sweetness === b.sweetness &&
    a.shotQty === b.shotQty &&
    a.syrupQty === b.syrupQty &&
    a.pearlQtys[0] === b.pearlQtys[0] &&
    a.pearlQtys[1] === b.pearlQtys[1] &&
    a.pearlQtys[2] === b.pearlQtys[2]
  )
}

/** 메뉴 카탈로그 기준으로 이름·이미지·단가 동기화 */
export function enrichOrderLineFromCatalog(line: OrderLineDraft): OrderLineDraft {
  const product = getMenuProduct(line.id)
  if (!product) return line
  return {
    ...line,
    name: product.name,
    imageSrc: product.imageSrc,
    unitPriceWon: product.unitPriceWon,
  }
}

export function orderLineDisplayName(line: OrderLineDraft): string {
  return getMenuProduct(line.id)?.name ?? line.name
}

export function computeAdditionalWon(line: OrderLineDraft): number {
  const catalog = getOptionCatalog()
  const shotPrice  = catalog.shot?.price  ?? CUSTOM_OPTION_UNIT_WON
  const syrupPrice = catalog.syrup?.price ?? CUSTOM_OPTION_UNIT_WON
  const pearlTotal = line.pearlQtys.reduce(
    (sum, qty, i) => sum + qty * (catalog.pearl[i]?.price ?? CUSTOM_OPTION_UNIT_WON),
    0,
  )
  return line.shotQty * shotPrice + line.syrupQty * syrupPrice + pearlTotal
}

export function computeLineTotalWon(line: OrderLineDraft): number {
  return line.unitPriceWon * line.quantity + computeAdditionalWon(line)
}

/** 주문 확인 화면 옵션 줄 — 예: ICE / R / 더 달게 / 화이트펄. 디저트는 빈 문자열 */
export function formatOrderOptionLine(line: OrderLineDraft): string {
  if (line.isDessert) return ''
  const parts: string[] = [
    line.temp === 'ice' ? 'ICE' : 'HOT',
    line.size === 'regular' ? 'R' : 'L',
    SWEETNESS_LABEL[line.sweetness],
  ]
  line.pearlQtys.forEach((qty, i) => {
    if (qty > 0) parts.push(PEARL_DISPLAY_NAMES[i])
  })
  return parts.join(' / ')
}
