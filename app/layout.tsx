import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartDrawer } from "@/components/customer/CartDrawer";
import "./globals.css";
import Providers from "./providers";

const helix = localFont({
  src: [
    {
      path: "../public/fonts/hellix/Hellix-Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-ThinItalic.ttf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-RegularItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-ExtraBold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-ExtraBoldItalic.ttf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/hellix/Hellix-Black.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/hellix/Hellix-BlackItalic.ttf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-helix",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nadinekollections.com'),
  title: {
    default: 'NadineKollections | Premium Fashion & Lifestyle',
    template: '%s | NadineKollections',
  },
  description: 'Discover premium fashion for women, men, and kids. Shop exclusive collections of clothing, accessories, and gadgets at NadineKollections.',
  keywords: ['fashion', 'premium clothing', 'women fashion', 'men fashion', 'kids clothing', 'accessories', 'gadgets', 'online shopping Nigeria'],
  authors: [{ name: 'NadineKollections' }],
  creator: 'NadineKollections',
  publisher: 'NadineKollections',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'NadineKollections',
    title: 'NadineKollections | Premium Fashion & Lifestyle',
    description: 'Discover premium fashion for women, men, and kids. Shop exclusive collections of clothing, accessories, and gadgets.',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'NadineKollections',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NadineKollections | Premium Fashion & Lifestyle',
    description: 'Discover premium fashion for women, men, and kids.',
    images: ['/og-image.jpg'],
    creator: '@nadinekollections',
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

import { Toaster } from "sonner";

import { AppShell } from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${helix.variable} antialiased bg-background text-text-primary font-sans`}
      >
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <CartDrawer />
          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
