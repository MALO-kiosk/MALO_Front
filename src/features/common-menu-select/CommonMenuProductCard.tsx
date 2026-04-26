import type { KeyboardEvent } from 'react'
import menuStrawberryImg from '@/assets/images/menu_StrawberryMatcha.png'
import './CommonMenuProductCard.css'

export type CommonMenuProductCardProps = {
  imageSrc?: string
  name?: string
  priceLabel?: string
  /** 카드 선택 시 (예: 하단 패널에 담기) */
  onSelect?: () => void
}

export function CommonMenuProductCard({
  imageSrc = menuStrawberryImg,
  name = '스트로베리말차',
  priceLabel = '3,900원',
  onSelect,
}: CommonMenuProductCardProps) {
  const interactive = Boolean(onSelect)

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!onSelect) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      className={
        interactive
          ? 'common-menu-product-card common-menu-product-card--interactive'
          : 'common-menu-product-card'
      }
      onClick={onSelect}
      onKeyDown={onKeyDown}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
    >
      <div
        className="common-menu-product-card__thumb"
        style={{ backgroundImage: `url(${imageSrc})` }}
        aria-hidden
      />
      <h3 className="common-menu-product-card__name">{name}</h3>
      <p className="common-menu-product-card__price">{priceLabel}</p>
    </article>
  )
}
