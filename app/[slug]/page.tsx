import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioCanvas } from "../components/PortfolioCanvas";
import { getPageBySlug, portfolioPages } from "../site-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return portfolioPages
    .filter((page) => page.slug !== "home")
    .map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = portfolioPages.find((item) => item.slug === slug);
  if (!page) return {};

  return {
    title: `${page.title} — Shane Soon`,
    description: page.description,
  };
}

export default async function PortfolioRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();
  return <PortfolioCanvas {...page} />;
}
