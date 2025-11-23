import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border-light pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">NadineKollections</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Experience soft-luxury shopping with world-class designs and premium products for your lifestyle.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-text-muted hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-text-muted hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-text-muted hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/shop/kids" className="hover:text-primary">Kids Collection</Link></li>
              <li><Link href="/shop/women" className="hover:text-primary">Women&apos;s Fashion</Link></li>
              <li><Link href="/shop/men" className="hover:text-primary">Men&apos;s Wear</Link></li>
              <li><Link href="/shop/accessories" className="hover:text-primary">Accessories</Link></li>
              <li><Link href="/shop/gadgets" className="hover:text-primary">Gadgets</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/track-order" className="hover:text-primary">Track Order</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-primary">Shipping Policy</Link></li>
              <li><Link href="/returns" className="hover:text-primary">Returns & Refunds</Link></li>
              <li><Link href="/faqs" className="hover:text-primary">FAQs</Link></li>
              <li><Link href="/contact" className="hover:text-primary">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
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
          <p>&copy; {new Date().getFullYear()} NadineKollections. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
