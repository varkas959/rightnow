import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is this clinic running on time right now? | StatusNow",
  description: "Check whether clinics in Whitefield, Bangalore are running smoothly or have waiting right now. Live visit status is based on recent visitor reports.",
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

