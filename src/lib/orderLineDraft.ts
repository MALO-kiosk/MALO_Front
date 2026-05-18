import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import type { EasyCartLineItem } from '@/components/common'
import { getMenuProduct } from '@/data/menuCatalog'

export type TempChoice = 'ice' | 'hot'
export type SizeChoice = 'regular' | 'large'
export type CupChoice = 'mug' | 'personal'
export type SweetnessChoice = 'more' | 'normal' | 'less'

export type OrderLineDraft = {
  id: string
  name: string
  imageSrc: string
  unitPriceWon: number
  quantity: number
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

export function createDefaultOrderLineDraft(): OrderLineDraft {
  return {
    id: 'strawberry-matcha',
    name: '스트로베리말차',
    imageSrc: menuStrawberryImg,
    unitPriceWon: 3900,
    quantity: 1,
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
  }
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
  const pearlSum = line.pearlQtys.reduce((a, b) => a + b, 0)
  return (line.shotQty + line.syrupQty + pearlSum) * CUSTOM_OPTION_UNIT_WON
}

export function computeLineTotalWon(line: OrderLineDraft): number {
  return line.unitPriceWon * line.quantity + computeAdditionalWon(line)
}

/** 주문 확인 화면 옵션 줄 — 예: ICE / R / 더 달게 / 화이트펄 */
export function formatOrderOptionLine(line: OrderLineDraft): string {
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
