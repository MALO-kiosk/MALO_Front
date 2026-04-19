import type { CSSProperties } from 'react'
import defaultMenuImage from '@/assets/images/menu_StrawberryMatcha.png'
import './EasyMenu.css'

export type EasyMenuProps = {
  /** 메뉴명 */
  name?: string
  /** 표시 가격 문자열 */
  price?: string
  /** 메뉴 이미지 (생략 시 스트로베리 말차) */
  imageSrc?: string
  /** 카드 탭 시 (장바구니 담기 등) */
  onSelect?: () => void
  className?: string
  style?: CSSProperties
}

export function EasyMenu({
  name = '스트로베리말차',
  price = '3,900원',
  imageSrc = defaultMenuImage,
  onSelect,
  className,
  style,
}: EasyMenuProps) {
  const imageUrl = imageSrc ?? defaultMenuImage

  const body = (
    <div className="easy-menu__inner">
      <div
        className="easy-menu__image"
        style={{ backgroundImage: `url(${imageUrl})` }}
        role="img"
        aria-label={name}
      />
      <p className="easy-menu__name">{name}</p>
      <p className="easy-menu__price">{price}</p>
    </div>
  )

  const articleClass = ['easy-menu', className].filter(Boolean).join(' ')
  const btnClass = ['easy-menu', 'easy-menu--btn', className]
    .filter(Boolean)
    .join(' ')

  if (onSelect) {
    return (
      <button
        type="button"
        className={btnClass}
        style={style}
        onClick={onSelect}
        aria-label={`${name} 장바구니에 담기`}
      >
        {body}
      </button>
    )
  }

  return (
    <article className={articleClass} style={style}>
      {body}
    </article>
  )
}
