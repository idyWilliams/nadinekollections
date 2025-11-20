"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide Header/Footer on Admin pages and Auth pages
  const isHidden =
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/admin/login";

  return (
    <>
      {!isHidden && <Header />}
      {children}
      {!isHidden && <Footer />}
      {!isHidden && <WhatsAppButton />}
    </>
  );
}
