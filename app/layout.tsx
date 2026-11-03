import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkTest AI Interview · Institute Mock Interview Platform",
  description: "AI-Powered Technical & HR Mock Interview Management Platform for IT Institutes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A]">
        {children}
      </body>
    </html>
  );
}
