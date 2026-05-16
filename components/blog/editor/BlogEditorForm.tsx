"use client";

import { useMemo, useState } from "react";

import {
  buildArticleJsonLd,
  buildBlogChecklist,
  calcReadingTime,
  calculateSeoScore,
  countWords,
  slugify,
  type BlogPostStatus,
  type SeoInput,
} from "@/lib/blog/editor";
import { api } from "@/lib/trpc/hooks";

type EditorTab = "content" | "author" | "schema";
type EditorMode = "edit" | "preview";

export type InitialPost = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string;
  authorName: string;
  authorRole: string;
  authorBio: string;
  imageAlt: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  status: "DRAFT" | "REVIEW" | "PUBLISHED";
  publishedAt: string | null;
};

type BlogEditorFormProps = {
  currentUserName: string;
  initialPost?: InitialPost;
};

type BlogEditorState = {
  title: string;
  slug: string;
  content: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  category: string;
  tags: string;
  authorName: string;
  authorRole: string;
  authorBio: string;
  imageAlt: string;
  publishDate: string;
  status: BlogPostStatus;
};

const STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Szkic",
  review: "Do weryfikacji",
  published: "Opublikowany",
};

const STATUS_TO_LOCAL: Record<"DRAFT" | "REVIEW" | "PUBLISHED", BlogPostStatus> = {
  DRAFT: "draft",
  REVIEW: "review",
  PUBLISHED: "published",
};

const STATUS_TO_API: Record<BlogPostStatus, "DRAFT" | "REVIEW" | "PUBLISHED"> = {
  draft: "DRAFT",
  review: "REVIEW",
  published: "PUBLISHED",
};

const tabs: { id: EditorTab; label: string }[] = [
  { id: "content", label: "Treść" },
  { id: "author", label: "Autor" },
  { id: "schema", label: "Dane strukturalne" },
];

const categories = [
  "Prawa pasażera",
  "Opóźnienia",
  "Odwołane loty",
  "Overbooking",
  "Bagaż",
  "Porady",
  "Case study",
];

const starterContent =
  "Wprowadź treść artykułu. Zacznij od krótkiego wstępu, opisz problem pasażera, wyjaśnij podstawę prawną i zakończ praktycznym CTA do sprawdzenia lotu.";

function buildSeoInput(state: BlogEditorState): SeoInput {
  return {
    title: state.title,
    slug: state.slug,
    content: state.content,
    focusKeyword: state.focusKeyword,
    metaTitle: state.metaTitle,
    metaDescription: state.metaDescription,
    ogTitle: state.ogTitle,
    ogDescription: state.ogDescription,
    canonicalUrl: state.canonicalUrl,
    category: state.category,
    tags: state.tags,
    authorName: state.authorName,
    authorBio: state.authorBio,
    imageAlt: state.imageAlt,
    noindex: state.noindex,
  };
}

function formatToday() {
  return new Date().toISOString().slice(0, 10);
}

function getScoreTone(score: number) {
  if (score >= 80) {
    return "text-green-700";
  }

  if (score >= 55) {
    return "text-[var(--ember-lo)]";
  }

  return "text-red-700";
}

function GooglePreview({ state }: { state: BlogEditorState }) {
  const title = state.metaTitle || state.title || "Tytuł artykułu OWEME";
  const description =
    state.metaDescription ||
    "Opis meta pojawi się tutaj. Powinien jasno mówić, czego użytkownik dowie się z artykułu.";
  const path = state.slug ? `/wiedza/${state.slug}` : "/wiedza/nowy-artykul";

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-950">Podgląd Google</h2>
      <div className="mt-3 rounded-md border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-xs text-green-700">oweme.pl{path}</p>
        <p className="mt-1 text-lg font-medium leading-snug text-blue-700">
          {title}
        </p>
        <p className="mt-1 line-clamp-3 text-sm leading-6 text-neutral-600">
          {description}
        </p>
      </div>
    </section>
  );
}

function SeoScorePanel({
  score,
  checklist,
}: {
  score: number;
  checklist: ReturnType<typeof buildBlogChecklist>;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">SEO score</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Wynik oparty o podstawową checklistę redakcyjną.
          </p>
        </div>
        <span className={`text-3xl font-semibold ${getScoreTone(score)}`}>
          {score}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-950 transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {checklist.map((item) => (
          <li key={item.id} className="flex gap-2 text-sm text-neutral-700">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                item.complete
                  ? "bg-green-50 text-green-700"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {item.complete ? "✓" : "•"}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArticlePreview({
  state,
  words,
  readingTime,
}: {
  state: BlogEditorState;
  words: number;
  readingTime: number;
}) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
        <span>{state.category || "Kategoria"}</span>
        <span>•</span>
        <span>{readingTime} min czytania</span>
        <span>•</span>
        <span>{words} słów</span>
      </div>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
        {state.title || "Tytuł artykułu"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-neutral-600">
        {state.metaDescription ||
          "Tu pojawi się krótki opis artykułu widoczny również w SEO."}
      </p>
      <div className="mt-5 rounded-md border border-neutral-100 bg-neutral-50 p-4">
        <p className="text-sm font-semibold text-neutral-950">
          {state.authorName || "Autor OWEME"}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {state.authorRole || "Redakcja"}
        </p>
      </div>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-neutral-800">
        {state.content || starterContent}
      </div>
    </article>
  );
}

export function BlogEditorForm({ currentUserName, initialPost }: BlogEditorFormProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [mode, setMode] = useState<EditorMode>("edit");
  const [touchedAutoFields, setTouchedAutoFields] = useState({
    slug: !!initialPost,
    metaTitle: !!initialPost,
    ogTitle: !!initialPost,
  });
  const [savedId, setSavedId] = useState<string | undefined>(initialPost?.id);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");

  const [state, setState] = useState<BlogEditorState>(() => {
    if (initialPost) {
      return {
        title: initialPost.title,
        slug: initialPost.slug,
        content: initialPost.content,
        focusKeyword: initialPost.focusKeyword,
        metaTitle: initialPost.metaTitle,
        metaDescription: initialPost.metaDescription || initialPost.excerpt,
        ogTitle: initialPost.ogTitle,
        ogDescription: initialPost.ogDescription,
        canonicalUrl: initialPost.canonicalUrl,
        noindex: initialPost.noindex,
        category: initialPost.category || categories[0],
        tags: initialPost.tags,
        authorName: initialPost.authorName,
        authorRole: initialPost.authorRole,
        authorBio: initialPost.authorBio,
        imageAlt: initialPost.imageAlt,
        publishDate: initialPost.publishedAt
          ? initialPost.publishedAt.slice(0, 10)
          : formatToday(),
        status: STATUS_TO_LOCAL[initialPost.status],
      };
    }
    return {
      title: "",
      slug: "",
      content: starterContent,
      focusKeyword: "",
      metaTitle: "",
      metaDescription: "",
      ogTitle: "",
      ogDescription: "",
      canonicalUrl: "",
      noindex: false,
      category: categories[0],
      tags: "",
      authorName: currentUserName,
      authorRole: "Redakcja OWEME",
      authorBio: "",
      imageAlt: "",
      publishDate: formatToday(),
      status: "draft",
    };
  });

  const upsert = api.blog.upsert.useMutation();

  const seoInput = useMemo(() => buildSeoInput(state), [state]);
  const checklist = useMemo(() => buildBlogChecklist(seoInput), [seoInput]);
  const seoScore = useMemo(() => calculateSeoScore(seoInput), [seoInput]);
  const words = useMemo(() => countWords(state.content), [state.content]);
  const readingTime = useMemo(() => calcReadingTime(words), [words]);
  const jsonLd = useMemo(
    () =>
      buildArticleJsonLd({
        ...seoInput,
        publishDate: state.publishDate,
      }),
    [seoInput, state.publishDate],
  );

  function updateField<K extends keyof BlogEditorState>(
    field: K,
    value: BlogEditorState[K],
  ) {
    setState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleTitleChange(value: string) {
    setState((current) => ({
      ...current,
      title: value,
      slug: touchedAutoFields.slug ? current.slug : slugify(value),
      metaTitle: touchedAutoFields.metaTitle ? current.metaTitle : value.slice(0, 60),
      ogTitle: touchedAutoFields.ogTitle ? current.ogTitle : value,
    }));
  }

  async function handleSave(publishNow = false) {
    setSaveStatus("saving");
    setSaveError("");
    try {
      const result = await upsert.mutateAsync({
        id: savedId,
        slug: state.slug,
        title: state.title,
        content: state.content,
        excerpt: state.metaDescription,
        category: state.category,
        tags: state.tags,
        authorName: state.authorName,
        authorRole: state.authorRole,
        authorBio: state.authorBio,
        imageAlt: state.imageAlt,
        focusKeyword: state.focusKeyword,
        metaTitle: state.metaTitle,
        metaDescription: state.metaDescription,
        ogTitle: state.ogTitle,
        ogDescription: state.ogDescription,
        canonicalUrl: state.canonicalUrl,
        noindex: state.noindex,
        status: publishNow ? "PUBLISHED" : STATUS_TO_API[state.status],
        publishedAt: state.publishDate ? new Date(state.publishDate) : null,
      });
      setSavedId(result.id);
      if (publishNow) updateField("status", "published");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Wystąpił błąd podczas zapisu.",
      );
      setSaveStatus("error");
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            {savedId ? "Edycja artykułu" : "Nowy artykuł"}
          </h1>
          {savedId && (
            <p className="mt-1 font-mono text-xs text-neutral-400">ID: {savedId}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saveStatus === "saved" && (
            <span className="flex h-10 items-center text-sm font-semibold text-green-600">
              Zapisano
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex h-10 max-w-xs items-center truncate text-sm text-red-600">
              {saveError}
            </span>
          )}
          <select
            value={state.status}
            onChange={(event) =>
              updateField("status", event.target.value as BlogPostStatus)
            }
            className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-800 outline-none focus:border-neutral-950"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saveStatus === "saving"}
            className="h-10 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-950 disabled:opacity-50"
          >
            {saveStatus === "saving" ? "Zapisywanie…" : "Zapisz"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
            className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            {mode === "edit" ? "Podgląd artykułu" : "Wróć do edycji"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saveStatus === "saving"}
            className="h-10 rounded-md bg-green-700 px-4 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
          >
            Opublikuj
          </button>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.38fr)]">
        <div className="min-w-0 space-y-5">
          {mode === "preview" ? (
            <ArticlePreview state={state} words={words} readingTime={readingTime} />
          ) : (
            <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
              <div className="flex flex-wrap gap-2 border-b border-neutral-100 p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? "bg-neutral-950 text-white"
                        : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "content" ? (
                <div className="grid gap-4 p-5">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Tytuł artykułu
                    </span>
                    <input
                      value={state.title}
                      onChange={(event) => handleTitleChange(event.target.value)}
                      className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      placeholder="np. Odszkodowanie za opóźniony lot: kompletny poradnik"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Slug
                      </span>
                      <input
                        value={state.slug}
                        onChange={(event) => {
                          setTouchedAutoFields((current) => ({
                            ...current,
                            slug: true,
                          }));
                          updateField("slug", slugify(event.target.value));
                        }}
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Fraza kluczowa
                      </span>
                      <input
                        value={state.focusKeyword}
                        onChange={(event) =>
                          updateField("focusKeyword", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Kategoria
                      </span>
                      <select
                        value={state.category}
                        onChange={(event) =>
                          updateField("category", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Tagi
                      </span>
                      <input
                        value={state.tags}
                        onChange={(event) => updateField("tags", event.target.value)}
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                        placeholder="np. opóźnienie, WE 261, odszkodowanie"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Treść
                    </span>
                    <textarea
                      value={state.content}
                      onChange={(event) => updateField("content", event.target.value)}
                      className="min-h-80 resize-y rounded-md border border-neutral-200 px-3 py-3 text-sm leading-7 outline-none focus:border-neutral-950"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Meta title
                      </span>
                      <input
                        value={state.metaTitle}
                        onChange={(event) => {
                          setTouchedAutoFields((current) => ({
                            ...current,
                            metaTitle: true,
                          }));
                          updateField("metaTitle", event.target.value);
                        }}
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                      <span className="text-xs text-neutral-400">
                        {state.metaTitle.length}/60 znaków
                      </span>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Canonical URL
                      </span>
                      <input
                        value={state.canonicalUrl}
                        onChange={(event) =>
                          updateField("canonicalUrl", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                        placeholder="https://oweme.pl/wiedza/..."
                      />
                    </label>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Meta description
                    </span>
                    <textarea
                      value={state.metaDescription}
                      onChange={(event) =>
                        updateField("metaDescription", event.target.value)
                      }
                      className="min-h-24 rounded-md border border-neutral-200 px-3 py-3 text-sm leading-6 outline-none focus:border-neutral-950"
                    />
                    <span className="text-xs text-neutral-400">
                      {state.metaDescription.length}/160 znaków
                    </span>
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        OG title
                      </span>
                      <input
                        value={state.ogTitle}
                        onChange={(event) => {
                          setTouchedAutoFields((current) => ({
                            ...current,
                            ogTitle: true,
                          }));
                          updateField("ogTitle", event.target.value);
                        }}
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        OG description
                      </span>
                      <input
                        value={state.ogDescription}
                        onChange={(event) =>
                          updateField("ogDescription", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={state.noindex}
                      onChange={(event) =>
                        updateField("noindex", event.target.checked)
                      }
                      className="h-4 w-4 accent-neutral-950"
                    />
                    Oznacz jako noindex
                  </label>
                </div>
              ) : null}

              {activeTab === "author" ? (
                <div className="grid gap-4 p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Autor
                      </span>
                      <input
                        value={state.authorName}
                        onChange={(event) =>
                          updateField("authorName", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Rola autora
                      </span>
                      <input
                        value={state.authorRole}
                        onChange={(event) =>
                          updateField("authorRole", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                  </div>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Bio autora
                    </span>
                    <textarea
                      value={state.authorBio}
                      onChange={(event) =>
                        updateField("authorBio", event.target.value)
                      }
                      className="min-h-32 rounded-md border border-neutral-200 px-3 py-3 text-sm leading-6 outline-none focus:border-neutral-950"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Alt tekst obrazka
                      </span>
                      <input
                        value={state.imageAlt}
                        onChange={(event) =>
                          updateField("imageAlt", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Data publikacji
                      </span>
                      <input
                        type="date"
                        value={state.publishDate}
                        onChange={(event) =>
                          updateField("publishDate", event.target.value)
                        }
                        className="h-11 rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              {activeTab === "schema" ? (
                <div className="grid gap-4 p-5">
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                    <h2 className="text-sm font-semibold text-neutral-950">
                      JSON-LD Article
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">
                      Podgląd danych strukturalnych generowanych na podstawie pól
                      formularza.
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-md bg-neutral-950 p-4 text-xs leading-6 text-neutral-50">
                    {JSON.stringify(jsonLd, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <aside className="min-w-0 space-y-5">
          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-950">
              Metryki wpisu
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Słowa
                </dt>
                <dd className="mt-1 text-xl font-semibold text-neutral-950">
                  {words}
                </dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Czytanie
                </dt>
                <dd className="mt-1 text-xl font-semibold text-neutral-950">
                  {readingTime} min
                </dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  {STATUS_LABELS[state.status]}
                </dd>
              </div>
              <div className="rounded-md bg-neutral-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Index
                </dt>
                <dd className="mt-1 text-sm font-semibold text-neutral-950">
                  {state.noindex ? "Noindex" : "Index"}
                </dd>
              </div>
            </dl>
          </section>
          <SeoScorePanel score={seoScore} checklist={checklist} />
          <GooglePreview state={state} />
        </aside>
      </section>
    </div>
  );
}
