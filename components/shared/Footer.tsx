import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TikTokIcon = ({ className = "" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1Z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border-light pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">Nadine Kollections</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Experience soft-luxury shopping with world-class designs and premium products for your lifestyle from all over the world.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                href="https://tiktok.com/@NadineKollections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="TikTok"
                title="TikTok: @NadineKollections"
              >
                <TikTokIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://instagram.com/nadinekollections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="Instagram"
                title="Instagram: Nadine Kollections"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com/nadinekollections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="Facebook"
                title="Facebook: Nadine Kollections"
              >
                <Facebook className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/shop/women" className="hover:text-primary">
                  Women
                </Link>
              </li>
              <li>
                <Link href="/shop/men" className="hover:text-primary">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/shop/kids" className="hover:text-primary">
                  Kids / Teens
                </Link>
              </li>
              <li>
                <Link href="/shop/accessories" className="hover:text-primary">
                  Accessories
                </Link>
              </li>
              <li>
                <Link href="/shop/gadgets" className="hover:text-primary">
                  Gadgets
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/track-order" className="hover:text-primary">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-primary">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary">
                  Returns &amp; Refunds
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-primary">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay Updated */}
          <div>
            <h4 className="font-semibold mb-4">Stay Updated</h4>
            <p className="text-sm text-text-secondary mb-4">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="space-y-2">
              <Input placeholder="Enter your email" type="email" />
              <Button className="w-full">Subscribe</Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border-light pt-8 text-center text-sm text-text-muted">
          <p>&copy; {new Date().getFullYear()} Nadine Kollections. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
