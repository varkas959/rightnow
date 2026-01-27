import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
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
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href="https://wbvmakojxlilbbxgpecz.supabase.co" />
        <link rel="dns-prefetch" href="https://wbvmakojxlilbbxgpecz.supabase.co" />
      </head>
      <body className="antialiased bg-white">{children}</body>
    </html>
  );
}

