'use client'

import { PanelManual } from './PanelManual'

export function PanelCancel() {
  return (
    <PanelManual
      lockedDisruption="cancel"
      helper="Odwołanie lotu zgłoszone krócej niż 14 dni przed odlotem może oznaczać nawet 600 € odszkodowania."
    />
  )
}
