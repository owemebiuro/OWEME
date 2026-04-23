export type BlogPostStatus = "draft" | "review" | "published";

export type SeoInput = {
  title: string;
  slug: string;
  content: string;
  focusKeyword: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  category: string;
  tags: string;
  authorName: string;
  authorBio: string;
  imageAlt: string;
  noindex: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

const polishCharacters: Record<string, string> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (character) => polishCharacters[character] ?? character)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function countWords(value: string) {
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim();

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).filter(Boolean).length;
}

export function calcReadingTime(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}

function includesKeyword(value: string, keyword: string) {
  if (!keyword.trim()) {
    return false;
  }

  return value.toLowerCase().includes(keyword.trim().toLowerCase());
}

export function buildBlogChecklist(input: SeoInput): ChecklistItem[] {
  const words = countWords(input.content);
  const tags = input.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [
    {
      id: "title",
      label: "Tytuł ma konkretną obietnicę i jest gotowy do publikacji.",
      complete: input.title.trim().length >= 35 && input.title.trim().length <= 75,
    },
    {
      id: "keyword",
      label: "Fraza kluczowa występuje w tytule i treści.",
      complete:
        includesKeyword(input.title, input.focusKeyword) &&
        includesKeyword(input.content, input.focusKeyword),
    },
    {
      id: "meta",
      label: "Meta title i meta description mają odpowiednią długość.",
      complete:
        input.metaTitle.trim().length >= 35 &&
        input.metaTitle.trim().length <= 60 &&
        input.metaDescription.trim().length >= 120 &&
        input.metaDescription.trim().length <= 160,
    },
    {
      id: "content",
      label: "Artykuł ma co najmniej 500 słów.",
      complete: words >= 500,
    },
    {
      id: "taxonomy",
      label: "Wybrano kategorię i dodano co najmniej 2 tagi.",
      complete: Boolean(input.category.trim()) && tags.length >= 2,
    },
    {
      id: "author",
      label: "Uzupełniono autora, bio i alt tekst obrazka.",
      complete:
        Boolean(input.authorName.trim()) &&
        input.authorBio.trim().length >= 50 &&
        Boolean(input.imageAlt.trim()),
    },
    {
      id: "share",
      label: "Uzupełniono dane Open Graph dla udostępniania.",
      complete:
        Boolean(input.ogTitle.trim()) && input.ogDescription.trim().length >= 80,
    },
  ];
}

export function calculateSeoScore(input: SeoInput) {
  const checklist = buildBlogChecklist(input);
  const baseScore = Math.round(
    (checklist.filter((item) => item.complete).length / checklist.length) * 100,
  );
  const canonicalBonus = input.canonicalUrl.trim() ? 5 : 0;
  const noindexPenalty = input.noindex ? 15 : 0;

  return Math.max(0, Math.min(100, baseScore + canonicalBonus - noindexPenalty));
}

export function buildArticleJsonLd(input: SeoInput & { publishDate: string }) {
  const tags = input.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title || input.metaTitle,
    description: input.metaDescription,
    author: {
      "@type": "Person",
      name: input.authorName,
      description: input.authorBio,
    },
    datePublished: input.publishDate || undefined,
    mainEntityOfPage: input.canonicalUrl || undefined,
    keywords: tags.length ? tags.join(", ") : undefined,
    articleSection: input.category || undefined,
  };
}
