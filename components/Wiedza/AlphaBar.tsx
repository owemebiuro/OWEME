'use client'

import { useState } from 'react'

import s from './AirlinesSection.module.css'

const LETTERS = Array.from({ length: 26 }, (_, index) => String.fromCharCode(65 + index))

interface AlphaBarProps {
  availableLetters: string[]
}

export default function AlphaBar({ availableLetters }: AlphaBarProps) {
  const [activeLetter, setActiveLetter] = useState(availableLetters[0] ?? 'A')
  const available = new Set(availableLetters)

  function goToLetter(letter: string) {
    const target = document.getElementById(`letter-${letter}`)
    if (!target) return

    setActiveLetter(letter)
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={s.alphaBar} aria-label="Filtr alfabetyczny linii lotniczych">
      {LETTERS.map((letter) => {
        const isAvailable = available.has(letter)
        const className = [
          s.alphaBtn,
          activeLetter === letter ? s.active : '',
          isAvailable ? '' : s.dim,
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <button
            key={letter}
            type="button"
            role="link"
            aria-label={`Przejdź do sekcji ${letter}`}
            className={className}
            disabled={!isAvailable}
            onClick={() => goToLetter(letter)}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}
