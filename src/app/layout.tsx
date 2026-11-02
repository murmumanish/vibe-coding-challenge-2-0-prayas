import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sports Academy Desk",
  description: "Track players, attendance, matches, and readiness for your sports academy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
