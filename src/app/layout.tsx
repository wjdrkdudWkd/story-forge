import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/authContext";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
