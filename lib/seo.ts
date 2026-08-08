import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const DEFAULT_OG_IMAGE = "/images/home/hero-bg.jpg";
export const DEFAULT_OG_IMAGE_ALT = `${SITE_NAME} — гайды Genshin Impact`;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    sameAs: ["https://t.me/guideshin"],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "ru-RU",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/wiki/characters?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(opts: {
  headline: string;
  description: string;
  url: string;
  image?: string | null;
  datePublished?: string | Date | null;
  dateModified?: string | Date | null;
  aboutName?: string;
  aboutDescription?: string;
}) {
  const imageUrl = opts.image
    ? opts.image.startsWith("http")
      ? opts.image
      : absoluteUrl(opts.image)
    : absoluteUrl(DEFAULT_OG_IMAGE);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    description: opts.description,
    image: [imageUrl],
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    datePublished: opts.datePublished
      ? new Date(opts.datePublished).toISOString()
      : undefined,
    dateModified: opts.dateModified
      ? new Date(opts.dateModified).toISOString()
      : undefined,
    about: opts.aboutName
      ? {
          "@type": "Thing",
          name: opts.aboutName,
          description: opts.aboutDescription,
        }
      : undefined,
  };
}

export function itemListJsonLd(opts: {
  name: string;
  description?: string;
  items: { name: string; url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.name,
    description: opts.description,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  aboutName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    about: opts.aboutName
      ? { "@type": "Thing", name: opts.aboutName }
      : undefined,
  };
}

export function faqPageJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Сериализует JSON-LD для `<script type="application/ld+json">`. */
export function serializeJsonLd(data: unknown | unknown[]): string {
  return JSON.stringify(data);
}
