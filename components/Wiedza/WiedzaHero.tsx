'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { AIRLINES, GENERAL_ARTICLES } from './wiedza.data'
import s from './WiedzaHero.module.css'

type SearchResult =
  | { type: 'article'; label: string; meta: string; href: string }
  | { type: 'airline'; label: string; meta: string; letter: string }

export default function WiedzaHero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLocaleLowerCase('pl')
    if (normalized.length < 2) return []

    const articleResults = GENERAL_ARTICLES.filter((article) =>
      article.title.toLocaleLowerCase('pl').includes(normalized),
    ).map<SearchResult>((article) => ({
      type: 'article',
      label: article.title,
      meta: `${article.tag} · ${article.readMin} min`,
      href: `/wiedza/${article.slug}`,
    }))

    const airlineResults = AIRLINES.filter((airline) =>
      `${airline.name} ${airline.iata} ${airline.country}`.toLocaleLowerCase('pl').includes(normalized),
    ).map<SearchResult>((airline) => ({
      type: 'airline',
      label: airline.name,
      meta: `${airline.iata} · ${airline.articles} art.`,
      letter: airline.name[0].toUpperCase(),
    }))

    return [...articleResults, ...airlineResults].slice(0, 8)
  }, [query])

  function openResult(result: SearchResult) {
    if (result.type === 'article') {
      router.push(result.href)
      return
    }

    const target = document.getElementById(`letter-${result.letter}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const [firstResult] = results
    if (firstResult) openResult(firstResult)
  }

  return (
    <section className={s.hero} aria-labelledby="wiedza-hero-title">
      <div className={s.inner}>
        <p className={s.eyebrow}>Twoje prawa pasażera</p>
        <h1 id="wiedza-hero-title">
          Twoje prawa, które przynoszą <em>odszkodowanie.</em>
        </h1>
        <p className={s.lead}>
          Przewodniki po EC 261/2004, analizy linii lotniczych i praktyczne porady napisane z myślą
          o pasażerach, którzy chcą działać szybko i spokojnie.
        </p>

        <form className={s.search} onSubmit={onSubmit}>
          <label className={s.searchLabel} htmlFor="wiedza-search">
            Szukaj artykułów i linii lotniczych
          </label>
          <div className={s.searchBox}>
            <span className={s.searchIcon} aria-hidden="true">
              ⌕
            </span>
            <input
              id="wiedza-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj — np. „Ryanair opóźnienie”, „siła wyższa”…"
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="wiedza-search-results"
              aria-label="Szukaj artykułów i linii lotniczych"
            />
            <button type="submit">Szukaj</button>
          </div>

          {results.length > 0 ? (
            <div id="wiedza-search-results" className={s.results} role="listbox">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.label}`}
                  type="button"
                  role="option"
                  aria-selected="false"
                  className={s.result}
                  onClick={() => openResult(result)}
                >
                  <span>
                    <strong>{result.label}</strong>
                    <small>{result.meta}</small>
                  </span>
                  <span className={s.resultType}>{result.type === 'article' ? 'Artykuł' : 'Linia'}</span>
                </button>
              ))}
            </div>
          ) : null}
        </form>

        <div className={s.stats} aria-label="Statystyki bazy wiedzy">
          <div>
            <strong>140+</strong>
            <span>artykuły</span>
          </div>
          <div>
            <strong>58</strong>
            <span>linii</span>
          </div>
          <div>
            <strong>600 €</strong>
            <span>EC 261</span>
          </div>
        </div>
      </div>
    </section>
  )
}
