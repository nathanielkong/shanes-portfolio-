import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://shane-soon-portfolio.netlify.app"),
  title: {
    default: "Shane Soon — Creative Portfolio",
    template: "%s",
  },
  description:
    "The creative portfolio of multimedia designer Shane Soon, specialising in advertising, branding, typography, layout, and digital design.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    title: "Shane Soon — Creative Portfolio",
    description:
      "Brand, editorial, campaign, and digital design by multimedia designer Shane Soon.",
    images: [
      {
        url: "/og.png",
        width: 1734,
        height: 907,
        alt: "Shane Soon Creative Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shane Soon — Creative Portfolio",
    description:
      "Brand, editorial, campaign, and digital design by multimedia designer Shane Soon.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
