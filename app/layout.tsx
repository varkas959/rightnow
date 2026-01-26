import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Check hospital crowds before you go | StatusNow",
  description: "Live status for Whitefield hospitals. Check whether hospitals in Whitefield, Bangalore are running smoothly or have waiting right now. Updated by people like you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

