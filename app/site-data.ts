import { generatedPages } from "./generated-pages";

export type PortfolioPage = {
  id: number;
  slug: string;
  title: string;
  description: string;
  height: number;
};

export const portfolioPages: PortfolioPage[] = [
  {
    id: 1,
    slug: "home",
    title: "Creative Portfolio",
    description:
      "The creative portfolio of multimedia designer Shane Soon, specialising in advertising, branding, typography, layout, and digital design.",
    height: 3257,
  },
  {
    id: 2,
    slug: "oopsie-daisy",
    title: "Oopsie Daisy",
    description: "Brand identity and floral studio design for Oopsie Daisy.",
    height: 8251,
  },
  {
    id: 3,
    slug: "sarawak-youth-talent",
    title: "Sarawak Youth Talent",
    description:
      "A campaign, website, booklet, and merchandise project celebrating creative youth in Sarawak.",
    height: 4337,
  },
  {
    id: 4,
    slug: "kiss-or-death",
    title: "Kiss or Death",
    description: "A campaign against animal testing in cosmetics.",
    height: 3898,
  },
  {
    id: 5,
    slug: "maruki-ramen",
    title: "Maruki Ramen",
    description: "A warm, modern rebrand for Maruki Ramen.",
    height: 3350,
  },
  {
    id: 6,
    slug: "unbound",
    title: "Unbound",
    description:
      "An editorial magazine cover inspired by architecture, culture, and public knowledge.",
    height: 3123,
  },
  {
    id: 7,
    slug: "christmas",
    title: "Christmas",
    description: "A playful festive 3D design project.",
    height: 3116,
  },
  {
    id: 8,
    slug: "soonami",
    title: "Soonami",
    description: "Personal branding and identity design for Shane Soon.",
    height: 4108,
  },
  {
    id: 9,
    slug: "contact",
    title: "Contact",
    description: "Get in touch with multimedia designer Shane Soon.",
    height: 540,
  },
];

export function getPageById(id: number) {
  const page = portfolioPages.find((item) => item.id === id);
  if (!page) throw new Error(`Unknown portfolio page: ${id}`);
  return { ...page, html: generatedPages[id] };
}

export function getPageBySlug(slug: string) {
  const page = portfolioPages.find((item) => item.slug === slug);
  if (!page) return null;
  return { ...page, html: generatedPages[page.id] };
}
