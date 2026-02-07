import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat TOB",
  description: "Bot workspace for AI chatbots with scoped context",
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
