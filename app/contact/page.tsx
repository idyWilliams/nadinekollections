import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-text-secondary text-lg">
              We'd love to hear from you. Our team is always here to chat.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Chat to us</h3>
                <p className="text-text-secondary">Our friendly team is here to help.</p>
                <a href="mailto:hello@nadinekollections.com" className="text-primary font-medium">hello@nadinekollections.com</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Visit us</h3>
                <p className="text-text-secondary">Come say hello at our office HQ.</p>
                <p className="text-text-primary font-medium">100 Smith Street<br/>Lekki Phase 1, Lagos</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Call us</h3>
                <p className="text-text-secondary">Mon-Fri from 8am to 5pm.</p>
                <a href="tel:+2348000000000" className="text-primary font-medium">+234 800 000 0000</a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-surface p-8 rounded-2xl shadow-card border border-border-light">
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First name</label>
                <Input placeholder="First name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last name</label>
                <Input placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Leave us a message..." className="min-h-[150px]" />
            </div>
            <Button className="w-full btn-primary">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
