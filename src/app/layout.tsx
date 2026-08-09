import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Norwegian Flashcards",
  description: "Create and study Norwegian-to-English flashcards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link className="font-semibold text-slate-950" href="/">
              Norwegian Flashcards
            </Link>
            <div className="flex items-center gap-4">
              <Link
                className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                href="/generate"
              >
                Generate
              </Link>
              <Link
                className="text-sm font-semibold text-sky-700 hover:text-sky-900"
                href="/cards"
              >
                All Flashcards
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
