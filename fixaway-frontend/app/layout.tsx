import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from '@/components/ui/ToastProvider';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ['400', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

const inter = Inter({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: "Fixaway | Home Maintenance & Roadside Assistance",
    template: "%s | Fixaway",
  },
  description: "Premium home maintenance and roadside assistance at your fingertips. Professional, verified technicians ready 24/7 across Egypt.",
  keywords: ["home maintenance", "roadside assistance", "plumbing", "electrical", "AC maintenance", "Egypt"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Fixaway",
    title: "Fixaway | Home Maintenance & Roadside Assistance",
    description: "Professional, verified technicians for home repairs and roadside emergencies. Book in 60 seconds.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fixaway — Trusted Help, Right When You Need It",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fixaway | Trusted Help, Right When You Need It",
    description: "Book verified technicians for home maintenance and roadside emergencies across Egypt.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${plusJakartaSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-body-md selection:bg-secondary-fixed" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
