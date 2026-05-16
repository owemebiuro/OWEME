import Link from 'next/link'

import ArticleCard from './ArticleCard'
import { GENERAL_ARTICLES } from './wiedza.data'
import s from './GeneralSection.module.css'

export default function GeneralSection() {
  const featured = GENERAL_ARTICLES.find((article) => article.featured) ?? GENERAL_ARTICLES[0]
  const articles = GENERAL_ARTICLES.filter((article) => article.slug !== featured.slug)
  const author = featured.author

  return (
    <section className={s.section} id="wiedza-ogolna" aria-labelledby="wiedza-ogolna-title">
      <div className={s.sectionHeader}>
        <p className={s.eyebrow}>Twoje prawa w praktyce</p>
        <h2 id="wiedza-ogolna-title">Najważniejsze prawa pasażera w jednym miejscu</h2>
      </div>

      <Link href={`/wiedza/${featured.slug}`} className={s.genFeatured}>
        <div className={s.gfBody}>
          <div className={s.gfTag}>
            <span />
            {featured.tag}
          </div>
          <h3>{featured.title}</h3>
          {featured.excerpt ? <p className={s.gfExcerpt}>{featured.excerpt}</p> : null}
          <div className={s.gfMeta}>
            {author ? (
              <>
                <span className={s.gfAvatar}>{author.initials}</span>
                <span className={s.gfAuthor}>
                  {author.name}
                  <small>{author.role}</small>
                </span>
              </>
            ) : null}
            <span className={s.gfDate}>{featured.date}</span>
            <span className={s.gfRead}>Czytaj →</span>
          </div>
        </div>
        <div className={s.gfVisual} aria-hidden="true">
          <span className={s.gfNumber}>261</span>
          <span className={s.gfPill}>EC 261/2004</span>
        </div>
      </Link>

      <div className={s.genGrid}>
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}
