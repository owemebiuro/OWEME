import type { MetadataRoute } from 'next'
import { ARTICLES } from '@/lib/articles'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: 'https://oweme.pl',
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...ARTICLES.map((article) => ({
      url: `https://oweme.pl/twoje-prawa/${article.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: article.slug === 'odszkodowanie-za-lot-czarterowy' ? 0.9 : 0.7,
    })),
  ]
}
