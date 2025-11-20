import type { Metadata } from "next";
import localFont from "next/font/local";
import { CartDrawer } from "@/components/customer/CartDrawer";
import "./globals.css";

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
  title: "NadineKollections | Ultra-Premium Shopping",
  description: "Experience soft-luxury shopping with NadineKollections.",
};

import { Toaster } from "sonner";

import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

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
        <Header />
        {children}
        <Footer />
        <WhatsAppButton />
        <CartDrawer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
