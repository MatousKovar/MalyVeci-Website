import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../../components/Navbar";

export const metadata: Metadata = {
  title: "MALÝ VĚCI – kapela ze Strakonic a Horažďovic | Oficiální stránky",
  description: "Mladá zábavová kapela z okolí Strakonic a Horažďovic",
  keywords: [
    "kapela",
    "zábavová kapela",
    "svatby",
    "plesy",
    "Večírky",
    "Strakonice",
    "Horažďovice",
    "Písek",
    "rock",
    "pop",
    "hudba",
    "Malý Věci",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MALÝ VĚCI – kapela ze Strakonic a Horažďovic",
    description: "Mladá zábavová kapela z okolí Strakonic a Horažďovic.",
    url: "https://www.malyveci.cz",
    siteName: "Malý Věci",
    images: [
      {
        url: "/uvodka.jpg", // put your logo/hero image in /public
        width: 1200,
        height: 630,
        alt: "Malý Věci – kapela Strakonice",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>{children}</body>
    </html>
  );
}
