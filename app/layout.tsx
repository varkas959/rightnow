import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0891b2",
};

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
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href="https://wbvmakojxlilbbxgpecz.supabase.co" />
        <link rel="dns-prefetch" href="https://wbvmakojxlilbbxgpecz.supabase.co" />
      </head>
      <body className="antialiased bg-white">{children}</body>
    </html>
  );
}

