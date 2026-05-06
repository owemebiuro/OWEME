'use client'

import { PanelManual } from './PanelManual'

export function PanelDelay() {
  return (
    <PanelManual
      lockedDisruption="delay"
      helper="Jeśli dotarłeś na miejsce co najmniej 3 godziny po czasie, sprawdzimy roszczenie z EC 261/2004."
    />
  )
}
