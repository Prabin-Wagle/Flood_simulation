import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiverTwin — Flood & Dam-Break Digital Twin",
  description: "Explore flood scenarios in Nepal. Simulate inundation, understand community impact, and plan earlier with RiverTwin.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
