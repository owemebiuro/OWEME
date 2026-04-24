import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import TagFilter from "@/components/TagFilter";
import NewsletterForm from "@/components/NewsletterForm";
import { ARTICLES, POPULAR } from "@/lib/articles";
import { createTRPCCaller } from "@/lib/trpc/server";
import styles from "./wiedza.module.css";
import navStyles from "@/app/landing.module.css";

export const metadata: Metadata = {
  title: "Wiedza – ClaimAir",
  description:
    "Prawa pasażerów, przepisy lotnicze i porady ekspertów — wszystko czego potrzebujesz, żeby skutecznie dochodzić swoich praw.",
};

export const revalidate = 60;

const TAGS_CLOUD = [
  "Opóźnienia", "Overbooking", "Bagaż", "WE 261/2004",
  "Konwencja Montrealska", "Ryanair", "Wizz Air", "LOT",
  "Odwołania", "Zwroty", "Prawo UE",
];

const THUMB_COLORS: Record<string, string> = {
  "Bagaż": "#fdf0e6",
  "Overbooking": "#fef7f0",
  "Prawo UE": "#fdf0e6",
  "Case study": "#fef7f0",
  "Porady": "#fdf0e6",
  "Opóźnienia": "#fef7f0",
};

type ArticleCard = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  authorInitials: string;
  authorName: string;
  authorColor?: string;
  date: string;
  readTime: number;
  views?: string;
  featured: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
      <path d="M6 3.5v3l2 1" stroke="#9e8e7e" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2l4 4-4 4" stroke="#9e8e7e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default async function WiedzaPage() {
  let articles: ArticleCard[] = [];

  try {
    const trpc = await createTRPCCaller();
    const dbPosts = await trpc.blog.listPublished();
    if (dbPosts.length > 0) {
      articles = dbPosts.map((post, i) => ({
        slug: post.slug,
        category: post.category,
        title: post.title,
        excerpt: post.excerpt || post.tags,
        authorInitials: initials(post.authorName),
        authorName: post.authorName,
        date: post.publishedAt
          ? new Date(post.publishedAt).toLocaleDateString("pl-PL", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "",
        readTime: post.readTime,
        featured: i === 0,
      }));
    }
  } catch {
    // Fall through to static articles
  }

  // Fall back to static articles when DB has nothing published yet
  if (articles.length === 0) {
    articles = ARTICLES.map((a) => ({
      slug: a.slug,
      category: a.category,
      title: a.title,
      excerpt: a.excerpt,
      authorInitials: a.author.initials,
      authorName: a.author.name,
      authorColor: a.author.color,
      date: a.date,
      readTime: a.readTime,
      views: a.views,
      featured: !!a.featured,
    }));
  }

  const featured = articles.find((a) => a.featured) ?? articles[0];
  const rest = articles.filter((a) => a !== featured);

  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      {/* Header */}
      <div className={styles.blogHeader}>
        <div className={styles.blogBreadcrumb}>
          <Link href="/">ClaimAir</Link>
          <ChevronIcon />
          Wiedza
        </div>
        <h1 className={styles.blogH1}>
          Wiedza, która<br />
          <span className={styles.blogH1Accent}>się wypłaca</span>
        </h1>
        <p className={styles.blogDesc}>
          Prawa pasażerów, przepisy lotnicze i porady ekspertów — wszystko czego
          potrzebujesz, żeby skutecznie dochodzić swoich praw.
        </p>
      </div>

      {/* Tag filter */}
      <TagFilter />

      {/* Main grid */}
      <div className={styles.blogMain}>
        <div>
          {/* Featured article */}
          {featured && (
            <Link href={`/wiedza/${featured.slug}`} className={styles.articleFeatured}>
              <div className={styles.featVisual}>
                <div className={styles.featVisualBg} />
                <div className={styles.featVisualInner}>
                  <svg width="140" height="140" viewBox="0 0 140 140" fill="none" opacity="0.3">
                    <circle cx="70" cy="70" r="60" stroke="#c96a2a" strokeWidth="1.5" strokeDasharray="6 8" />
                    <path d="M20 70L70 10l50 60H100v50H40V70H20z" fill="#c96a2a" opacity="0.5" />
                    <path d="M50 90h40M60 70h20" stroke="#c96a2a" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span className={styles.featLabel}>Wyróżniony artykuł</span>
                </div>
              </div>
              <div className={styles.featBody}>
                <div className={styles.featTag}>{featured.category}</div>
                <div className={styles.featTitle}>{featured.title}</div>
                <div className={styles.featExcerpt}>{featured.excerpt}</div>
                <div className={styles.featMeta}>
                  <div className={styles.featAuthor}>
                    <div className={styles.authorAv}>{featured.authorInitials}</div>
                    <span className={styles.authorName}>{featured.authorName}</span>
                  </div>
                  <span className={styles.dotSep}>·</span>
                  <span className={styles.featDate}>{featured.date}</span>
                  <span className={styles.dotSep}>·</span>
                  <span className={styles.featRead}>
                    <ClockIcon />
                    {featured.readTime} min
                  </span>
                </div>
                <span className={styles.readMoreLink}>Czytaj artykuł →</span>
              </div>
            </Link>
          )}

          {/* Article grid */}
          <div className={styles.articleGrid}>
            {rest.map((article) => (
              <Link
                key={article.slug}
                href={`/wiedza/${article.slug}`}
                className={styles.articleCard}
              >
                <div
                  className={styles.cardThumb}
                  style={{ background: THUMB_COLORS[article.category] ?? "#fdf0e6" }}
                >
                  <div className={styles.thumbBg} />
                  <div className={styles.thumbIcon}>
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" opacity="0.35">
                      <circle cx="28" cy="28" r="18" stroke="#c96a2a" strokeWidth="2" />
                      <path d="M28 20v8.5l5 3" stroke="#c96a2a" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTag}>{article.category}</div>
                  <div className={styles.cardTitle}>{article.title}</div>
                  <div className={styles.cardExcerpt}>{article.excerpt}</div>
                  <div className={styles.cardFooter}>
                    <div className={styles.cardAuthorSm}>
                      <div
                        className={styles.avSm}
                        style={article.authorColor ? { background: article.authorColor } : undefined}
                      >
                        {article.authorInitials}
                      </div>
                      <span className={styles.cardByline}>{article.authorName}</span>
                    </div>
                    <span className={styles.cardReadTime}>{article.readTime} min</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button className={`${styles.pgBtn} ${styles.pgBtnActive}`}>1</button>
            <button className={styles.pgBtn}>2</button>
            <button className={styles.pgBtn}>3</button>
            <span className={styles.pgDots}>…</span>
            <button className={styles.pgBtn}>12</button>
            <button className={`${styles.pgBtn} ${styles.pgBtnWide}`}>Dalej →</button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* CTA */}
          <div className={styles.sidebarCta}>
            <h3>Sprawdź swój lot w 30 sekund</h3>
            <p>Bezpłatna analiza. Wynagrodzenie tylko po wygranej.</p>
            <Link href="/#checker" className={styles.sidebarCtaBtn}>
              Sprawdź teraz →
            </Link>
          </div>

          {/* Popular */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Najpopularniejsze</div>
            {POPULAR.map((article, i) => (
              <Link key={article.slug} href={`/wiedza/${article.slug}`} className={styles.popItem}>
                <div className={styles.popNum}>{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div className={styles.popTitle}>{article.title}</div>
                  <div className={styles.popMeta}>
                    {article.readTime} min · {article.views} wyświetleń
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Newsletter</div>
            <p className={styles.nlDesc}>
              Nowe artykuły i aktualizacje prawa co dwa tygodnie.
            </p>
            <NewsletterForm />
          </div>

          {/* Tag cloud */}
          <div className={styles.sidebarSection}>
            <div className={styles.sidebarLabel}>Tematy</div>
            <div className={styles.tagCloud}>
              {TAGS_CLOUD.map((tag) => (
                <span key={tag} className={styles.cloudTag}>{tag}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className={navStyles.footer}>
        <p className={navStyles.footerCopy}>© 2025 ClaimAir sp. z o.o. · Wszelkie prawa zastrzeżone</p>
        <div className={navStyles.footerLinks}>
          <a href="#">Polityka prywatności</a>
          <a href="#">Regulamin</a>
          <a href="#">Kontakt</a>
        </div>
      </footer>
    </>
  );
}
