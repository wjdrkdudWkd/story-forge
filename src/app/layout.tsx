import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "story-forge",
  description: "Block-based story and web novel ideation tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
