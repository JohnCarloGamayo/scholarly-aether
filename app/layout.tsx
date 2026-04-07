import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scholarly Aether | Accelerate Your Research",
  description: "AI-first academic workspace built on FastAPI and Firecrawl",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body>{children}</body>
    </html>
  );
}
