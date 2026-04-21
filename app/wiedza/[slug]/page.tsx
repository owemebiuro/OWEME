import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import ReadingProgress from "@/components/ReadingProgress";
import { ARTICLES, getArticleBySlug } from "@/lib/articles";
import styles from "../wiedza.module.css";
import navStyles from "@/app/landing.module.css";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} – ClaimAir`,
    description: article.excerpt,
  };
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2l4 4-4 4" stroke="#9e8e7e" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

const related = ARTICLES.filter((a) => !a.featured).slice(0, 3);

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <ReadingProgress />

      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      {/* Article header */}
      <div className={styles.articleHeader}>
        <div className={styles.articleBc}>
          <Link href="/wiedza">Wiedza</Link>
          <ChevronIcon />
          <Link href="/wiedza">{article.category}</Link>
          <ChevronIcon />
          <span style={{ color: "var(--text-3)" }}>{article.slug}</span>
        </div>

        <div className={styles.articleTagRow}>
          <span className={styles.articleTag}>{article.category}</span>
          <span className={styles.articleReading}>
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ verticalAlign: "middle" }}>
              <circle cx="6" cy="6" r="5" stroke="#9e8e7e" strokeWidth="1" />
              <path d="M6 3.5v3l2 1" stroke="#9e8e7e" strokeWidth="1" strokeLinecap="round" />
            </svg>
            {article.readTime} minut czytania
          </span>
        </div>

        <h1 className={styles.articleTitle}>{article.title}</h1>
        <p className={styles.articleSubtitle}>{article.excerpt}</p>

        <div className={styles.articleByline}>
          <div
            className={styles.bylineAv}
            style={article.author.color ? { background: article.author.color } : undefined}
          >
            {article.author.initials}
          </div>
          <div>
            <div className={styles.bylineName}>{article.author.name}</div>
            <div className={styles.bylineMeta}>
              {article.author.role ?? "Redakcja ClaimAir"} · {article.date}
              {article.dateUpdated && ` · Zaktualizowano: ${article.dateUpdated}`}
            </div>
          </div>
          <div className={styles.bylineSep} />
          <div className={styles.bylineShare}>
            <button className={styles.shareBtn} title="Kopiuj link">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="11" cy="3" r="1.5" stroke="#5c4f42" strokeWidth="1.2" />
                <circle cx="11" cy="11" r="1.5" stroke="#5c4f42" strokeWidth="1.2" />
                <circle cx="3" cy="7" r="1.5" stroke="#5c4f42" strokeWidth="1.2" />
                <path d="M4.3 6.3l5.4-2.7M4.3 7.7l5.4 2.7" stroke="#5c4f42" strokeWidth="1.2" />
              </svg>
            </button>
            <button className={styles.shareBtn} title="Twitter / X">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M2 12L12 2" stroke="#5c4f42" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button className={styles.shareBtn} title="LinkedIn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="#5c4f42" strokeWidth="1.2" />
                <path d="M5 6v4M5 4.5v.1M7 10V7.5c0-1 .5-1.5 1.5-1.5s1.5.5 1.5 1.5V10" stroke="#5c4f42" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Hero strip */}
      <div className={styles.articleHeroStrip}>
        <div className={styles.heroStripBg} />
        <div className={styles.heroStripContent}>
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>600</div>
            <div className={styles.heroStripTiny}>€ MAX / os.</div>
          </div>
          <div className={styles.heroStripDivider} />
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" opacity="0.22">
            <path d="M10 50L50 5l40 45H75v40H25V50H10z" fill="#c96a2a" />
            <path d="M35 65h30M42 50h16" stroke="#c96a2a" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className={styles.heroStripDivider} />
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>3</div>
            <div className={styles.heroStripTiny}>LATA na roszczenie</div>
          </div>
          <div className={styles.heroStripDivider} />
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>+3h</div>
            <div className={styles.heroStripTiny}>opóźnienia wymagane</div>
          </div>
        </div>
      </div>

      {/* Body + sidebar */}
      <div className={styles.articleBodyWrap}>
        <div className={styles.articleContent}>
          <div className={styles.prose} id="article-prose">
            <p>
              Każdego roku miliony Europejczyków doświadczają opóźnionych, odwołanych lub
              przepełnionych lotów. Większość z nich nie wie, że przysługuje im konkretne,
              gotówkowe odszkodowanie — niezależnie od tego, czy kupili bilet za 50 złotych,
              czy za 2000. Rozporządzenie WE 261/2004 to jedno z najsilniejszych praw
              konsumenckich na świecie.
            </p>

            <div className={styles.callout}>
              <p>
                <strong>Kluczowa zasada:</strong> Odszkodowanie z WE 261/2004 nie zależy od
                ceny biletu. Przysługuje każdemu pasażerowi — bez względu na to, czy leciał
                tanimi liniami, czy business class.
              </p>
            </div>

            <h2 id="kiedy">Kiedy przysługuje odszkodowanie?</h2>

            <p>
              Rozporządzenie ma zastosowanie jeśli Twój lot spełnia przynajmniej jeden
              z poniższych warunków: wylata z lotniska znajdującego się na terenie UE, lub
              przylatuje do UE i jest obsługiwany przez europejskiego przewoźnika.
            </p>

            <p>
              W praktyce oznacza to, że loty Ryanair z Londynu do Madrytu, LOT z Warszawy
              do Nowego Jorku i Lufthansa z Frankfurtu do Tokio — wszystkie objęte są tym
              samym rozporządzeniem.
            </p>

            <h2 id="ile">Ile możesz dostać?</h2>

            <p>
              Wysokość odszkodowania zależy wyłącznie od długości trasy. Oto dokładna
              tabela:
            </p>

            <table className={styles.compTable}>
              <thead>
                <tr>
                  <th>Długość trasy</th>
                  <th>Rodzaj zdarzenia</th>
                  <th>Kwota</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Do 1 500 km</td>
                  <td>Opóźnienie 3h+, odwołanie, overbooking</td>
                  <td className={styles.compAmount}>250 €</td>
                </tr>
                <tr>
                  <td>1 500 – 3 500 km</td>
                  <td>Opóźnienie 3h+, odwołanie, overbooking</td>
                  <td className={styles.compAmount}>400 €</td>
                </tr>
                <tr>
                  <td>Powyżej 3 500 km (wewnątrz UE)</td>
                  <td>Opóźnienie 3h+, odwołanie, overbooking</td>
                  <td className={styles.compAmount}>400 €</td>
                </tr>
                <tr>
                  <td>Powyżej 3 500 km (poza UE)</td>
                  <td>Opóźnienie 4h+, odwołanie, overbooking</td>
                  <td className={styles.compAmount}>600 €</td>
                </tr>
              </tbody>
            </table>

            <h2 id="jak">Jak złożyć wniosek?</h2>

            <p>
              Możesz działać samodzielnie — pisząc bezpośrednio do linii lotniczej, a w razie
              odmowy — do krajowego organu nadzoru (w Polsce to Urząd Lotnictwa Cywilnego) lub
              sądu. Możesz też zlecić to specjalistycznej firmie.
            </p>

            <div className={styles.articleCtaInline}>
              <div>
                <h3>Sprawdź czy kwalifikujesz się do odszkodowania</h3>
                <p>Podaj numer lotu — analiza jest bezpłatna i zajmuje 30 sekund.</p>
              </div>
              <Link href="/#checker" className={styles.articleCtaBtn}>
                Sprawdź lot →
              </Link>
            </div>

            <h2 id="okolicznosci">Nadzwyczajne okoliczności — kiedy linia może odmówić?</h2>

            <p>
              Linie lotnicze mogą zwolnić się z obowiązku wypłaty odszkodowania tylko wtedy,
              gdy opóźnienie lub odwołanie było spowodowane{" "}
              <strong>nadzwyczajnymi okolicznościami</strong>, których nie można było uniknąć
              nawet przy zachowaniu wszelkich racjonalnych środków.
            </p>

            <p>
              Za nadzwyczajne okoliczności uznaje się m.in.: poważne awarie systemu kontroli
              ruchu lotniczego, ekstremalne warunki pogodowe uniemożliwiające bezpieczny
              start, ryzyko bezpieczeństwa wykryte przez organy nadzoru oraz niezapowiedziane
              strajki kontrolerów ruchu lotniczego.
            </p>

            <p>
              Za nadzwyczajne okoliczności <strong>nie uznaje się</strong>: usterek
              technicznych samolotu (nawet rzadkich), strajków pracowników samej linii,
              overbookingu ani &quot;problemów operacyjnych&quot;.
            </p>

            <h2 id="przedawnienie">Przedawnienie — ile czasu masz?</h2>

            <p>
              Przepisy różnią się w zależności od kraju, w którym składasz roszczenie.
              W Polsce termin przedawnienia wynosi 3 lata od dnia lotu. W Niemczech — tylko
              rok. We Francji — 5 lat. Dlatego warto działać szybko.
            </p>

            {/* Article tags */}
            <div className={styles.articleTagsRow}>
              <span className={styles.articleTagsLabel}>Tematy:</span>
              {["WE 261/2004", "Prawa pasażera", "Opóźnienia", "Odszkodowania", "Prawo UE"].map(
                (tag) => (
                  <span key={tag} className={styles.artTag}>{tag}</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className={styles.articleSidebar}>
          {/* TOC */}
          <div className={styles.toc}>
            <div className={styles.tocLabel}>Spis treści</div>
            {[
              { id: "kiedy", label: "Kiedy przysługuje odszkodowanie?" },
              { id: "ile", label: "Ile możesz dostać?" },
              { id: "jak", label: "Jak złożyć wniosek?" },
              { id: "okolicznosci", label: "Nadzwyczajne okoliczności" },
              { id: "przedawnienie", label: "Przedawnienie" },
            ].map((item) => (
              <a key={item.id} href={`#${item.id}`} className={styles.tocItem}>
                <span className={styles.tocDot} />
                <span className={styles.tocText}>{item.label}</span>
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className={styles.sidebarCta}>
            <h3>Masz lot do sprawdzenia?</h3>
            <p>Analiza bezpłatna. Działa w 30 sekund.</p>
            <Link href="/#checker" className={styles.sidebarCtaBtn}>
              Sprawdź lot →
            </Link>
          </div>

          {/* Author */}
          {article.author.bio && (
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarLabel}>O autorze</div>
              <div className={styles.authorCard}>
                <div
                  className={styles.authorCardAv}
                  style={article.author.color ? { background: article.author.color } : undefined}
                >
                  {article.author.initials}
                </div>
                <div>
                  <div className={styles.authorCardName}>{article.author.name}</div>
                  <div className={styles.authorCardRole}>{article.author.role}</div>
                </div>
              </div>
              <p className={styles.authorCardBio}>{article.author.bio}</p>
            </div>
          )}
        </aside>
      </div>

      {/* Related articles */}
      <div className={styles.relatedSection}>
        <h2 className={styles.relatedH2}>Powiązane artykuły</h2>
        <div className={styles.relatedGrid}>
          {related.map((rel) => (
            <Link key={rel.slug} href={`/wiedza/${rel.slug}`} className={styles.articleCard}>
              <div
                className={styles.cardThumb}
                style={{ background: "#fdf0e6", height: 120 }}
              >
                <div className={styles.thumbBg} />
                <div className={styles.thumbIcon}>
                  <svg width="44" height="44" viewBox="0 0 56 56" fill="none" opacity="0.3">
                    <circle cx="28" cy="28" r="18" stroke="#c96a2a" strokeWidth="2" />
                    <path d="M28 20v8.5l5 3" stroke="#c96a2a" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTag}>{rel.category}</div>
                <div className={styles.cardTitle}>{rel.title}</div>
                <div className={styles.cardFooter} style={{ marginTop: "auto" }}>
                  <div className={styles.cardAuthorSm}>
                    <div
                      className={styles.avSm}
                      style={rel.author.color ? { background: rel.author.color } : undefined}
                    >
                      {rel.author.initials}
                    </div>
                    <span className={styles.cardByline}>{rel.author.name}</span>
                  </div>
                  <span className={styles.cardReadTime}>{rel.readTime} min</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
