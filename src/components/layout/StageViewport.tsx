import type { CSSProperties, PropsWithChildren } from 'react'
import { STAGE_HEIGHT, STAGE_WIDTH } from '@/config/stage'
import './StageViewport.css'

export function StageViewport({ children }: PropsWithChildren) {
  const stageVars = {
    ['--stage-w' as string]: String(STAGE_WIDTH),
    ['--stage-h' as string]: String(STAGE_HEIGHT),
  } as CSSProperties

  return (
    <div className="stage-viewport" style={stageVars}>
      <div
        className="stage-viewport__canvas"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
        data-stage
      >
        {children}
      </div>
    </div>
  )
}
