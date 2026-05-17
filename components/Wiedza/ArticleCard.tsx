import Link from 'next/link'

import type { Article } from './wiedza.data'
import s from './GeneralSection.module.css'

interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/twoje-prawa/${article.slug}`} className={s.articleCard}>
      <span className={s.articleTag}>{article.tag}</span>
      <h3 className={s.articleTitle}>{article.title}</h3>
      <div className={s.articleFooter}>
        <span>{article.date}</span>
        <span>{article.readMin} min</span>
      </div>
    </Link>
  )
}
