import type { Metadata } from "next";
import "./globals.css";
import { PrimaryNavigation } from "./primary-navigation";

export const metadata: Metadata = {
  title: "Norwegian Learning",
  description: "Create and study Norwegian Flashcard Decks and Quizzes.",
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
          <PrimaryNavigation />
        </header>
        {children}
      </body>
    </html>
  );
}
