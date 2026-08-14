import Link from "next/link";
import { Facebook, Instagram, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border-light pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-lg font-bold text-primary">NadineKollections</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Premium fashion & lifestyle store — corporate wear, leisure wear, shoes, wigs, accessories & gadgets. Shipped from UK to Africa & worldwide.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://tiktok.com/@NadineKollections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-primary transition-colors"
                aria-label="TikTok"
                title="TikTok: @NadineKollections"
              >
                <Music className="h-5 w-5" />
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

          {/* Shop — Audience */}
          <div>
            <h4 className="font-semibold mb-4">Shop By Audience</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/shop/women" className="hover:text-primary">Women&apos;s Collection</Link></li>
              <li><Link href="/shop/men" className="hover:text-primary">Men&apos;s Wear</Link></li>
              <li><Link href="/shop/kids" className="hover:text-primary">Kids Fashion</Link></li>
              <li><Link href="/shop/all?categories=Teens" className="hover:text-primary">Teens Wear</Link></li>
              <li><Link href="/shop/all?categories=Girls" className="hover:text-primary">Girls</Link></li>
              <li><Link href="/shop/all?categories=Boys" className="hover:text-primary">Boys</Link></li>
            </ul>
          </div>

          {/* Shop — Top Product Lines */}
          <div>
            <h4 className="font-semibold mb-4">Top Categories</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/shop/all?categories=Shoes" className="hover:text-primary">Shoes</Link></li>
              <li><Link href="/shop/all?categories=Shoes,Pumps" className="hover:text-primary">Pumps & Heels</Link></li>
              <li><Link href="/shop/all?categories=Shoes,Flats" className="hover:text-primary">Flats & Loafers</Link></li>
              <li><Link href="/shop/all?categories=Shoes,Sneakers" className="hover:text-primary">Sneakers</Link></li>
              <li><Link href="/shop/all?categories=Wigs" className="hover:text-primary">Wigs — All Colors</Link></li>
              <li><Link href="/shop/all?categories=Bags" className="hover:text-primary">Bags & Handbags</Link></li>
            </ul>
          </div>

          {/* Shop — More */}
          <div>
            <h4 className="font-semibold mb-4">More Categories</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/shop/all?categories=Watches" className="hover:text-primary">Watches & Bangles</Link></li>
              <li><Link href="/shop/all?categories=Jewelry" className="hover:text-primary">Jewelry & Earrings</Link></li>
              <li><Link href="/shop/all?categories=Pantyhose" className="hover:text-primary font-medium text-primary/80">Pantyhose (Best Seller)</Link></li>
              <li><Link href="/shop/all?categories=Scarves" className="hover:text-primary">Scarves</Link></li>
              <li><Link href="/shop/accessories" className="hover:text-primary">All Accessories</Link></li>
              <li><Link href="/shop/gadgets" className="hover:text-primary">Gadgets & Tech</Link></li>
              <li><Link href="/shop/all?categories=Makeup" className="hover:text-primary">Makeup & Beauty</Link></li>
              <li><Link href="/shop/all?categories=Aviation" className="hover:text-primary">Aviation Collection</Link></li>
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
