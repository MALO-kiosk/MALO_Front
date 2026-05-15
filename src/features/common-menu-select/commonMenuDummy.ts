import type { EasyCartLineItem } from '@/components/common'
import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'

/** 공통 메뉴 선택 화면용 더미 상품 (API 연동 전) */
export const COMMON_MENU_DUMMY_PRODUCT = {
  id: 'strawberry-matcha',
  name: '스트로베리말차',
  imageSrc: menuStrawberryImg,
  unitPriceWon: 3900,
  priceLabel: '3,900원',
} as const

export function commonMenuDummyCartLine(quantity: number): EasyCartLineItem {
  return {
    id: COMMON_MENU_DUMMY_PRODUCT.id,
    name: COMMON_MENU_DUMMY_PRODUCT.name,
    unitPriceWon: COMMON_MENU_DUMMY_PRODUCT.unitPriceWon,
    imageSrc: COMMON_MENU_DUMMY_PRODUCT.imageSrc,
    quantity,
  }
}
