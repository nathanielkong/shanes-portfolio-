export type InteractiveProject = {
  slug: string;
  title: string;
  category: string;
  href: string;
  preview: string;
  images: string[];
};

export const interactiveProjects: InteractiveProject[] = [
  {
    slug: "oopsie-daisy",
    title: "Oopsie Daisy",
    category: "Branding",
    href: "/oopsie-daisy",
    preview: "/assets/77852ca4bd869aff.png",
    images: [
      "/assets/77852ca4bd869aff.png",
      "/assets/9278dcb4aa940edd.png",
      "/assets/ca9ee71cdfbc7db2.png",
      "/assets/eaa637a87f4f0f50.png",
      "/assets/5d1b76ca5063eb7d.png",
    ],
  },
  {
    slug: "sarawak-youth-talent",
    title: "Sarawak Youth Talent",
    category: "Campaign",
    href: "/sarawak-youth-talent",
    preview: "/assets/1449480df1fc762e.png",
    images: [
      "/assets/1449480df1fc762e.png",
      "/assets/eb9ad7b38124e5b4.png",
      "/assets/302cad3f77e41f37.jpg",
      "/assets/440d38c129db18d1.jpg",
      "/assets/f27733ce7c73c0d0.jpg",
    ],
  },
  {
    slug: "kiss-or-death",
    title: "Kiss or Death",
    category: "Campaign",
    href: "/kiss-or-death",
    preview: "/assets/65cf5119847a60bb.png",
    images: [
      "/assets/65cf5119847a60bb.png",
      "/assets/b7a99e9d28ce2bb7.png",
      "/assets/824158b59df198a3.png",
      "/assets/1afd40bd7f6d270f.png",
      "/assets/5a0613b45e0d0bd9.png",
    ],
  },
  {
    slug: "maruki-ramen",
    title: "Maruki Ramen",
    category: "Rebranding",
    href: "/maruki-ramen",
    preview: "/assets/0d0d7cdb60f40adc.png",
    images: [
      "/assets/0d0d7cdb60f40adc.png",
      "/assets/c590a229556bd2ad.png",
      "/assets/4cc8f736032cf982.png",
      "/assets/266be31e78274c51.png",
      "/assets/861a156289e6aa1d.png",
    ],
  },
  {
    slug: "unbound",
    title: "Unbound",
    category: "Magazine Design",
    href: "/unbound",
    preview: "/assets/2a1a3a11b7e00e61.jpg",
    images: [
      "/assets/2a1a3a11b7e00e61.jpg",
      "/assets/8f6a707183992ab9.jpg",
      "/assets/f48529929f5e8d0e.jpg",
      "/assets/6451c5f4378efadc.jpg",
      "/assets/788b6d2995d48b62.jpg",
    ],
  },
  {
    slug: "christmas",
    title: "Christmas",
    category: "3D Design",
    href: "/christmas",
    preview: "/assets/96deecf0c55d85f3.jpg",
    images: [
      "/assets/96deecf0c55d85f3.jpg",
      "/assets/ab80769a4ba9803c.jpg",
      "/assets/edc2bd6b7839b411.jpg",
      "/assets/6d625ddfa6991274.png",
      "/assets/1489a8d4453fbdb5.png",
    ],
  },
  {
    slug: "soonami",
    title: "Soonami",
    category: "Personal Branding",
    href: "/soonami",
    preview: "/assets/a7942f5313b08bd6.png",
    images: [
      "/assets/a7942f5313b08bd6.png",
      "/assets/1e325283e3e2fc74.png",
      "/assets/281e35a0882cc116.png",
      "/assets/45ad3220211f029c.png",
      "/assets/777816dd33069530.png",
    ],
  },
];

export function getInteractiveProject(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return interactiveProjects.find((project) => project.href === normalized) ?? null;
}
