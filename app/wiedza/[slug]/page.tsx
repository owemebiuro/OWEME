import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer/Footer";
import { Nav } from "@/components/Nav/Nav";
import ReadingProgress from "@/components/ReadingProgress";
import { ARTICLES, getArticleBySlug } from "@/lib/articles";
import { createTRPCCaller } from "@/lib/trpc/server";
import styles from "../wiedza.module.css";

export const revalidate = 60;
const CHARTER_ARTICLE_SLUG = "odszkodowanie-za-lot-czarterowy";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (slug !== CHARTER_ARTICLE_SLUG) {
    try {
      const trpc = await createTRPCCaller();
      const post = await trpc.blog.getPublishedBySlug({ slug });
      const title = `${post.metaTitle || post.title} – oweme.`;
      const description = post.metaDescription || post.excerpt;
      const canonical = `https://oweme.pl/wiedza/${slug}`;

      return {
        title,
        description,
        alternates: { canonical },
        openGraph: {
          title,
          description,
          url: canonical,
          type: "article",
        },
        twitter: {
          title,
          description,
        },
      };
    } catch {
      // Static fallback below.
    }
  }

  const article = getArticleBySlug(slug);
  if (!article) return {};
  const title = `${article.title} – oweme.`;
  const canonical = `https://oweme.pl/wiedza/${article.slug}`;

  return {
    title,
    description: article.excerpt,
    alternates: { canonical },
    openGraph: {
      title,
      description: article.excerpt,
      url: canonical,
      type: "article",
    },
    twitter: {
      title,
      description: article.excerpt,
    },
  };
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2l4 4-4 4" stroke="var(--mist)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const related = ARTICLES.filter((a) => !a.featured).slice(0, 3);

const defaultTocItems = [
  { id: "kiedy", label: "Kiedy przysługuje odszkodowanie?" },
  { id: "ile", label: "Ile możesz dostać?" },
  { id: "jak", label: "Jak złożyć wniosek?" },
  { id: "okolicznosci", label: "Nadzwyczajne okoliczności" },
  { id: "przedawnienie", label: "Przedawnienie" },
];

const charterTocItems = [
  { id: "czarter-a-prawo", label: "Lot czarterowy a EC 261/2004" },
  { id: "kiedy-przysluguje", label: "Kiedy przysługuje odszkodowanie" },
  { id: "ile", label: "Ile wynosi odszkodowanie" },
  { id: "kto-placi", label: "Kto wypłaca odszkodowanie" },
  { id: "odwolana-wycieczka", label: "Odwołana wycieczka a lot" },
  { id: "jak-zlozyc", label: "Jak złożyć wniosek" },
  { id: "przedawnienie", label: "Jak długo masz czas" },
  { id: "faq", label: "Najczęstsze pytania" },
];

function getTocItems(slug: string) {
  return slug === CHARTER_ARTICLE_SLUG ? charterTocItems : defaultTocItems;
}

function CharterArticleBody() {
  return (
    <>
      <p>
        Wykupiłeś wycieczkę, lot był opóźniony o kilka godzin albo w ogóle go odwołano.
        Zastanawiasz się, czy linia czarterowa podlega tym samym przepisom co Ryanair czy
        LOT. Odpowiedź jest jasna: tak. Tutaj wyjaśniamy wszystko, co powinieneś wiedzieć.
      </p>

      <div className={styles.callout}>
        <p>
          <strong>Najważniejsza odpowiedź:</strong> pasażerom lotów czarterowych przysługuje
          odszkodowanie na podstawie Rozporządzenia (WE) nr 261/2004. Ochrona obejmuje loty
          regularne i nieregularne, także te stanowiące część zorganizowanych wycieczek.
          Za opóźniony, odwołany lot lub odmowę wejścia na pokład możesz dostać od 250 do
          600 euro na osobę.
        </p>
      </div>

      <h2 id="czarter-a-prawo">Lot czarterowy a Rozporządzenie 261/2004</h2>
      <p>
        Wiele osób błędnie uważa, że Rozporządzenie (WE) nr 261/2004 chroni wyłącznie
        pasażerów lotów regularnych kupowanych bezpośrednio od linii lotniczych. To nieprawda
        i warto to powiedzieć wprost, bo ta pomyłka kosztuje pasażerów miliony euro
        niezłożonych roszczeń każdego roku.
      </p>
      <p>
        Motyw 5 preambuły rozporządzenia jasno wskazuje, że ochrona powinna obejmować nie
        tylko pasażerów lotów regularnych, ale również pasażerów lotów nieregularnych, w tym
        loty stanowiące część zorganizowanych wycieczek. Ustawodawca unijny przewidział tę
        sytuację celowo i świadomie.
      </p>
      <p>
        Art. 3 ust. 1 rozporządzenia stosuje się do pasażerów odlatujących z lotniska na
        terytorium państwa członkowskiego UE i nie różnicuje lotów regularnych oraz
        czarterowych. Art. 3 ust. 5 precyzuje natomiast, że gdy pasażer ma umowę z
        organizatorem wycieczki, obsługujący przewoźnik wykonuje obowiązki wynikające z
        rozporządzenia w imieniu organizatora.
      </p>
      <p>
        Krótko: nieważne, czy leciałeś Ryanairem kupionym samodzielnie, czy samolotem
        czarterowym w ramach wakacji all-inclusive. Jeśli samolot startował z lotniska w
        Polsce lub innym kraju UE, masz pełne prawa pasażerskie wynikające z rozporządzenia.
      </p>

      <h2 id="kiedy-przysluguje">Kiedy przysługuje odszkodowanie za lot czarterowy</h2>
      <p>
        Warunki są identyczne jak w przypadku lotów regularnych. Rozporządzenie wyróżnia trzy
        sytuacje, w których masz prawo do odszkodowania pieniężnego.
      </p>
      <ul>
        <li>
          <strong>Opóźnienie powyżej 3 godzin w miejscu docelowym.</strong> Liczy się czas
          przylotu do miejsca docelowego, nie czas odlotu z lotniska wyjazdu.
        </li>
        <li>
          <strong>Odwołanie lotu bez odpowiedniego wyprzedzenia.</strong> Odszkodowanie nie
          przysługuje, jeśli linia poinformowała Cię co najmniej 14 dni przed odlotem albo
          zaproponowała odpowiednią zmianę trasy w krótszym terminie.
        </li>
        <li>
          <strong>Odmowa przyjęcia na pokład, czyli overbooking.</strong> W czarterach zdarza
          się rzadziej niż w lotach regularnych, ale nadal jest możliwa.
        </li>
      </ul>
      <div className={styles.callout}>
        <p>
          <strong>Warunek formalny:</strong> musisz mieć potwierdzoną rezerwację i stawić się
          do odprawy w czasie wskazanym przez przewoźnika, organizatora wycieczki lub biuro
          podróży. Jeśli czas nie został podany na piśmie, obowiązuje zasada: nie później niż
          45 minut przed planowaną godziną odlotu.
        </p>
      </div>

      <h2 id="ile">Ile wynosi odszkodowanie</h2>
      <p>
        Kwoty są identyczne jak dla lotów regularnych i wynikają z art. 7 ust. 1
        rozporządzenia. Zależą od odległości trasy mierzonej metodą ortodromy, a nie od ceny
        biletu ani pakietu wakacyjnego.
      </p>
      <table className={styles.compTable}>
        <thead>
          <tr>
            <th>Długość trasy</th>
            <th>Przykłady tras wakacyjnych</th>
            <th>Kwota</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Do 1 500 km</td>
            <td>Polska - Chorwacja, Bułgaria, Włochy, Grecja kontynentalna</td>
            <td className={styles.compAmount}>250 euro</td>
          </tr>
          <tr>
            <td>1 500 - 3 500 km</td>
            <td>Polska - Wyspy Kanaryjskie, Turcja, Egipt, Tunezja</td>
            <td className={styles.compAmount}>400 euro</td>
          </tr>
          <tr>
            <td>Powyżej 3 500 km</td>
            <td>Polska - Dominikana, Tajlandia, Meksyk, ZEA</td>
            <td className={styles.compAmount}>600 euro</td>
          </tr>
        </tbody>
      </table>
      <p>
        Kwota przysługuje każdemu pasażerowi z osobna. Jeśli lecieliście we czwórkę i lot był
        opóźniony o 4 godziny na trasie Kraków - Hurghada, łączna kwota odszkodowania dla
        rodziny może wynosić 4 x 600 euro, czyli 2400 euro.
      </p>
      <p>
        Jeśli linia zaoferowała lot zastępczy, który dotarł do celu z opóźnieniem
        nieprzekraczającym ustawowych limitów, przewoźnik może obniżyć kwotę o 50%. Przy braku
        alternatywy lub przy większym opóźnieniu odszkodowanie przysługuje w pełnej wysokości.
      </p>

      <h2 id="kto-placi">Kto wypłaca odszkodowanie: linia czy biuro podróży?</h2>
      <p>
        To jedno z najczęstszych pytań przy lotach czarterowych. W locie czarterowym masz
        zazwyczaj umowę z biurem podróży lub organizatorem wycieczki, a nie bezpośrednio z
        linią lotniczą. Mimo to roszczenie o ryczałtowe odszkodowanie kierujesz do
        obsługującego przewoźnika lotniczego.
      </p>
      <p>
        Obsługujący przewoźnik to linia, której samolot faktycznie wykonał lot albo miał go
        wykonać. Biuro podróży może dochodzić od linii zwrotu kosztów, które poniosło na Twoją
        rzecz, ale to jego wewnętrzna sprawa. Dla pasażera kluczowe jest ustalenie nazwy
        przewoźnika z karty pokładowej, potwierdzenia rezerwacji albo numeru lotu.
      </p>
      <p>
        Wyjątek dotyczy zwrotu ceny biletu w ramach imprezy turystycznej. Takie roszczenie może
        wynikać z przepisów o imprezach turystycznych i wtedy dochodzi się go od biura podróży.
        Odszkodowanie ryczałtowe z art. 7 rozporządzenia należy się jednak od linii.
      </p>

      <h2 id="odwolana-wycieczka">Odwołana wycieczka a odwołany lot: ważna różnica</h2>
      <p>
        Art. 3 ust. 6 rozporządzenia zawiera istotny wyjątek: EC 261/2004 nie ma zastosowania,
        gdy zorganizowana wycieczka jest odwołana z przyczyn innych niż odwołanie samego lotu.
      </p>
      <h3>EC 261/2004 ma zastosowanie, gdy:</h3>
      <ul>
        <li>wycieczka została odwołana, bo linia lotnicza odwołała lot,</li>
        <li>lot został odwołany lub opóźniony, mimo że reszta wycieczki doszła do skutku,</li>
        <li>lot powrotny opóźnił się i wróciłeś do Polski kilka godzin później,</li>
        <li>linia odmówiła przyjęcia na pokład na lotnisku.</li>
      </ul>
      <h3>EC 261/2004 nie ma zastosowania, gdy:</h3>
      <ul>
        <li>biuro podróży odwołało wycieczkę z własnej decyzji biznesowej,</li>
        <li>wycieczka została odwołana z powodu sytuacji w hotelu lub w miejscu docelowym,</li>
        <li>organizator zmienił trasę wycieczki, ale lot jednak się odbył.</li>
      </ul>
      <p>
        Gdy problem leży po stronie biura podróży, Twoje roszczenia reguluje ustawa o imprezach
        turystycznych i powiązanych usługach turystycznych. Możesz żądać zwrotu kosztów lub
        odszkodowania od organizatora, ale na innej podstawie prawnej niż EC 261/2004.
      </p>

      <h2 id="jak-zlozyc">Jak złożyć wniosek o odszkodowanie</h2>
      <ol>
        <li>
          <strong>Ustal obsługującego przewoźnika.</strong> Sprawdź kartę pokładową,
          potwierdzenie rezerwacji albo numer lotu. Szukasz nazwy linii, nie nazwy biura.
        </li>
        <li>
          <strong>Zbierz dokumenty.</strong> Przydadzą się karta pokładowa, potwierdzenie
          rezerwacji, komunikaty SMS lub e-mail oraz paragony za wydatki na lotnisku.
        </li>
        <li>
          <strong>Sprawdź roszczenie bezpłatnie.</strong> Na oweme.pl podajesz numer lotu i
          datę. System weryfikuje, czy lot podlegał rozporządzeniu i jaką kwotę możesz odzyskać.
        </li>
        <li>
          <strong>Złóż reklamację do linii.</strong> Pismo kierujesz do obsługującego
          przewoźnika, powołując się na Rozporządzenie (WE) nr 261/2004 i art. 7.
        </li>
        <li>
          <strong>Przy odmowie: sąd albo cesja wierzytelności.</strong> Jeśli linia milczy lub
          odmawia, możesz działać samodzielnie albo powierzyć sprawę kancelarii.
        </li>
      </ol>

      <div className={styles.articleCtaInline}>
        <div>
          <h3>Sprawdź swoje odszkodowanie</h3>
          <p>Wpisz numer lotu i datę. Weryfikacja jest bezpłatna i do niczego nie zobowiązuje.</p>
        </div>
        <Link href="/#checker" className={styles.articleCtaBtn}>
          Sprawdź lot →
        </Link>
      </div>

      <h2 id="przedawnienie">Jak długo masz czas na roszczenie</h2>
      <p>
        W Polsce roszczenia pasażerów wynikające z Rozporządzenia (WE) nr 261/2004 przedawniają
        się z upływem 1 roku od dnia wykonania przewozu, a gdy przewóz nie został wykonany, od
        dnia, w którym miał być wykonany. Wynika to z art. 205c ust. 7 Prawa lotniczego.
      </p>
      <p>
        Bieg przedawnienia zawiesza się na okres od dnia złożenia reklamacji do dnia udzielenia
        odpowiedzi albo do dnia, w którym upłynął termin na jej rozpatrzenie. Termin na
        rozpatrzenie reklamacji wynosi 30 dni. Milczenie przewoźnika przez 30 dni oznacza
        uznanie reklamacji.
      </p>
      <div className={styles.callout}>
        <p>
          <strong>Działaj od razu:</strong> 1 rok od daty lotu to krótki termin. Złóż reklamację
          jak najszybciej po locie, zwłaszcza jeśli przewoźnik czarterowy odpowiada wolno albo
          odsyła Cię do biura podróży.
        </p>
      </div>

      <h2 id="faq">Najczęstsze pytania</h2>
      <h3>Mam tylko vouchery z biura podróży, nie kartę pokładową. Czy mogę złożyć wniosek?</h3>
      <p>
        Tak. Potwierdzenie rezerwacji od biura podróży zwykle wystarcza do złożenia roszczenia.
        Kartę pokładową często da się odtworzyć, kontaktując się z linią lotniczą albo biurem.
      </p>
      <h3>Linia czarterowa już nie istnieje. Czy mogę dochodzić odszkodowania?</h3>
      <p>
        Jeśli linia ogłosiła upadłość lub zakończyła działalność, dochodzenie roszczenia od niej
        jest bardzo trudne. W części spraw możliwe są roszczenia wobec organizatora wycieczki,
        ale wymaga to indywidualnej oceny.
      </p>
      <h3>Lot powrotny był opóźniony o 4 godziny. Czy mam prawo do odszkodowania za obie strony?</h3>
      <p>
        Każdy lot to odrębne zdarzenie. Jeśli opóźniony był tylko lot powrotny, odszkodowanie
        przysługuje za lot powrotny. Kwota zależy od odległości tej trasy.
      </p>
      <h3>Linia powołuje się na złą pogodę. Czy to zamyka sprawę?</h3>
      <p>
        Nie zawsze. Linia musi udowodnić, że warunki faktycznie uniemożliwiały lot i że nie dało
        się uniknąć skutków zakłócenia. Samo ogólne powołanie się na pogodę nie wystarcza.
      </p>
      <h3>Leciałem z Niemiec na wakacje all-inclusive. Czy rozporządzenie mnie chroni?</h3>
      <p>
        Tak. EC 261/2004 stosuje się do lotów startujących z lotnisk w każdym państwie UE, nie
        tylko w Polsce. Możesz dochodzić roszczenia w dogodnej jurysdykcji, zależnie od sprawy.
      </p>

      <div className={styles.articleTagsRow}>
        <span className={styles.articleTagsLabel}>Tematy:</span>
        {["Lot czarterowy", "EC 261/2004", "Biuro podróży", "Opóźnienie", "Odwołany lot"].map(
          (tag) => (
            <span key={tag} className={styles.artTag}>
              {tag}
            </span>
          ),
        )}
      </div>
    </>
  );
}

type DbPost = Awaited<
  ReturnType<Awaited<ReturnType<typeof createTRPCCaller>>["blog"]["getPublishedBySlug"]>
>;

function DbArticleView({ post }: { post: DbPost }) {
  const authorInitials = initials(post.authorName);
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <>
      <ReadingProgress />
      <Nav />

      <div className={styles.articleHeader}>
        <div className={styles.articleBc}>
          <span>Twoje prawa</span>
          <ChevronIcon />
          <span>{post.category}</span>
          <ChevronIcon />
          <span style={{ color: "var(--text-3)" }}>{post.slug}</span>
        </div>

        <div className={styles.articleTagRow}>
          <span className={styles.articleTag}>{post.category}</span>
          <span className={styles.articleReading}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 12 12"
              fill="none"
              style={{ verticalAlign: "middle" }}
            >
              <circle cx="6" cy="6" r="5" stroke="var(--mist)" strokeWidth="1" />
              <path d="M6 3.5v3l2 1" stroke="var(--mist)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            {post.readTime} minut czytania
          </span>
        </div>

        <h1 className={styles.articleTitle}>{post.title}</h1>
        <p className={styles.articleSubtitle}>{post.excerpt || post.metaDescription}</p>

        <div className={styles.articleByline}>
          <div className={styles.bylineAv}>{authorInitials}</div>
          <div>
            <div className={styles.bylineName}>{post.authorName}</div>
            <div className={styles.bylineMeta}>
              {post.authorRole} · {publishDate}
            </div>
          </div>
          <div className={styles.bylineSep} />
          <div className={styles.bylineShare}>
            <button className={styles.shareBtn} title="Kopiuj link">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="11" cy="3" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <circle cx="11" cy="11" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <circle cx="3" cy="7" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <path d="M4.3 6.3l5.4-2.7M4.3 7.7l5.4 2.7" stroke="var(--mist2)" strokeWidth="1.2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.articleHeroStrip}>
        <div className={styles.heroStripBg} />
        <div className={styles.heroStripContent}>
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>600</div>
            <div className={styles.heroStripTiny}>€ MAX / os.</div>
          </div>
          <div className={styles.heroStripDivider} />
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" opacity="0.22">
            <path d="M10 50L50 5l40 45H75v40H25V50H10z" fill="var(--ember)" />
          </svg>
          <div className={styles.heroStripDivider} />
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>
              {post.slug === CHARTER_ARTICLE_SLUG ? "1" : "3"}
            </div>
            <div className={styles.heroStripTiny}>
              {post.slug === CHARTER_ARTICLE_SLUG ? "ROK w Polsce" : "LATA na roszczenie"}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.articleBodyWrap}>
        <div className={styles.articleContent}>
          <div className={styles.prose} id="article-prose">
            <div className="whitespace-pre-wrap">{post.content}</div>

            {post.tags && (
              <div className={styles.articleTagsRow}>
                <span className={styles.articleTagsLabel}>Tematy:</span>
                {post.tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={tag} className={styles.artTag}>
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.articleSidebar}>
          <div className={styles.sidebarCta}>
            <h3>Masz lot do sprawdzenia?</h3>
            <p>Analiza bezpłatna. Działa w 30 sekund.</p>
            <Link href="/#checker" className={styles.sidebarCtaBtn}>
              Sprawdź lot →
            </Link>
          </div>

          {post.authorBio && (
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarLabel}>O autorze</div>
              <div className={styles.authorCard}>
                <div className={styles.authorCardAv}>{authorInitials}</div>
                <div>
                  <div className={styles.authorCardName}>{post.authorName}</div>
                  <div className={styles.authorCardRole}>{post.authorRole}</div>
                </div>
              </div>
              <p className={styles.authorCardBio}>{post.authorBio}</p>
            </div>
          )}
        </aside>
      </div>

      <div className={styles.relatedSection}>
        <h2 className={styles.relatedH2}>Powiązane artykuły</h2>
        <div className={styles.relatedGrid}>
          {related.map((rel) => (
            <Link
              key={rel.slug}
              href={`/wiedza/${rel.slug}`}
              className={styles.articleCard}
            >
              <div className={styles.cardThumb} style={{ background: "var(--ember-bg)", height: 120 }}>
                <div className={styles.thumbBg} />
                <div className={styles.thumbIcon}>
                  <svg width="44" height="44" viewBox="0 0 56 56" fill="none" opacity="0.3">
                    <circle cx="28" cy="28" r="18" stroke="var(--ember)" strokeWidth="2" />
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

      <Footer />
    </>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch from DB first (data only — no JSX inside the try block)
  let dbPost: DbPost | null = null;
  if (slug !== CHARTER_ARTICLE_SLUG) {
    try {
      const trpc = await createTRPCCaller();
      dbPost = await trpc.blog.getPublishedBySlug({ slug });
    } catch {
      // Not in DB — fall through to static fallback
    }
  }

  if (dbPost) {
    return <DbArticleView post={dbPost} />;
  }

  // Static fallback
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <ReadingProgress />
      <Nav />

      {/* Article header */}
      <div className={styles.articleHeader}>
        <div className={styles.articleBc}>
          <span>Twoje prawa</span>
          <ChevronIcon />
          <span>{article.category}</span>
          <ChevronIcon />
          <span style={{ color: "var(--text-3)" }}>{article.slug}</span>
        </div>

        <div className={styles.articleTagRow}>
          <span className={styles.articleTag}>{article.category}</span>
          <span className={styles.articleReading}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 12 12"
              fill="none"
              style={{ verticalAlign: "middle" }}
            >
              <circle cx="6" cy="6" r="5" stroke="var(--mist)" strokeWidth="1" />
              <path d="M6 3.5v3l2 1" stroke="var(--mist)" strokeWidth="1" strokeLinecap="round" />
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
              {article.author.role ?? "Redakcja oweme."} · {article.date}
              {article.dateUpdated && ` · Zaktualizowano: ${article.dateUpdated}`}
            </div>
          </div>
          <div className={styles.bylineSep} />
          <div className={styles.bylineShare}>
            <button className={styles.shareBtn} title="Kopiuj link">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="11" cy="3" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <circle cx="11" cy="11" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <circle cx="3" cy="7" r="1.5" stroke="var(--mist2)" strokeWidth="1.2" />
                <path d="M4.3 6.3l5.4-2.7M4.3 7.7l5.4 2.7" stroke="var(--mist2)" strokeWidth="1.2" />
              </svg>
            </button>
            <button className={styles.shareBtn} title="Twitter / X">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M2 12L12 2" stroke="var(--mist2)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button className={styles.shareBtn} title="LinkedIn">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="var(--mist2)" strokeWidth="1.2" />
                <path
                  d="M5 6v4M5 4.5v.1M7 10V7.5c0-1 .5-1.5 1.5-1.5s1.5.5 1.5 1.5V10"
                  stroke="var(--mist2)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
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
            <path d="M10 50L50 5l40 45H75v40H25V50H10z" fill="var(--ember)" />
            <path d="M35 65h30M42 50h16" stroke="var(--ember)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className={styles.heroStripDivider} />
          <div className={styles.heroStripStat}>
            <div className={styles.heroStripBig}>
              {article.slug === CHARTER_ARTICLE_SLUG ? "1" : "3"}
            </div>
            <div className={styles.heroStripTiny}>
              {article.slug === CHARTER_ARTICLE_SLUG ? "ROK w Polsce" : "LATA na roszczenie"}
            </div>
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
            {article.slug === CHARTER_ARTICLE_SLUG ? (
              <CharterArticleBody />
            ) : (
              <>
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
                  <span key={tag} className={styles.artTag}>
                    {tag}
                  </span>
                ),
              )}
            </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky sidebar */}
        <aside className={styles.articleSidebar}>
          {/* TOC */}
          <div className={styles.toc}>
            <div className={styles.tocLabel}>Spis treści</div>
            {getTocItems(article.slug).map((item) => (
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
                style={{ background: "var(--ember-bg)", height: 120 }}
              >
                <div className={styles.thumbBg} />
                <div className={styles.thumbIcon}>
                  <svg width="44" height="44" viewBox="0 0 56 56" fill="none" opacity="0.3">
                    <circle cx="28" cy="28" r="18" stroke="var(--ember)" strokeWidth="2" />
                    <path
                      d="M28 20v8.5l5 3"
                      stroke="var(--ember)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
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

      <Footer />
    </>
  );
}
