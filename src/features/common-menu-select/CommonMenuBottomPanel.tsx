import { Children } from 'react'
import type { ReactNode } from 'react'
import './CommonMenuBottomPanel.css'

export type CommonMenuBottomPanelProps = {
  children?: ReactNode
}

export function CommonMenuBottomPanel({ children }: CommonMenuBottomPanelProps) {
  const childArray = Children.toArray(children)
  return (
    <div className="common-menu-bottom-panel">
      <div className="common-menu-bottom-panel__items">
        {childArray.map((child, i) => (
          <div key={i} className="common-menu-bottom-panel__entry">
            {child}
            <hr className="common-menu-bottom-panel__rule" aria-hidden />
          </div>
        ))}
      </div>
    </div>
  )
}
