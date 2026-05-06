'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FAQ_ITEMS } from '@/lib/constants'
import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './FAQ.module.css'

function FAQItem({
  q,
  a,
  index,
  openIndex,
  setOpen,
}: {
  q: string
  a: string
  index: number
  openIndex: number | null
  setOpen: (index: number | null) => void
}) {
  const isOpen = openIndex === index
  const answerId = `faq-answer-${index}`
  const questionId = `faq-question-${index}`

  return (
    <div className={styles.item}>
      <button
        id={questionId}
        type="button"
        className={styles.question}
        onClick={() => setOpen(isOpen ? null : index)}
        aria-expanded={isOpen}
        aria-controls={answerId}
      >
        <span>{q}</span>
        <span className={[styles.plus, isOpen ? styles.plusOpen : ''].join(' ')} aria-hidden="true">
          +
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={answerId}
            role="region"
            aria-labelledby={questionId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.27, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.answer}>{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const half = Math.ceil(FAQ_ITEMS.length / 2)

  return (
    <section className={styles.section} id="faq" aria-label="Często zadawane pytania">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>FAQ</span>
            <h2>Najczęstsze pytania przed złożeniem wniosku</h2>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {[FAQ_ITEMS.slice(0, half), FAQ_ITEMS.slice(half)].map((column, columnIndex) => (
            <RevealWrapper key={columnIndex === 0 ? 'left' : 'right'} delay={columnIndex * 0.07}>
              <div className={styles.col}>
                {column.map((item, itemIndex) => {
                  const index = columnIndex === 0 ? itemIndex : itemIndex + half

                  return (
                    <FAQItem
                      key={item.q}
                      q={item.q}
                      a={item.a}
                      index={index}
                      openIndex={openIndex}
                      setOpen={setOpenIndex}
                    />
                  )
                })}
              </div>
            </RevealWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}
