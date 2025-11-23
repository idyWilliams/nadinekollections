import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

        <div className="bg-surface p-8 rounded-xl shadow-card border border-border-light">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I place an order?</AccordionTrigger>
              <AccordionContent>
                Simply browse our collection, add items to your cart, and proceed to checkout. You can checkout as a guest or create an account for faster future purchases.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major credit/debit cards (Visa, Mastercard, Verve) via our secure payment partner, Paystack. We also accept bank transfers.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How long does delivery take?</AccordionTrigger>
              <AccordionContent>
                Standard delivery takes 3-5 business days within Lagos, and 5-7 business days for other states. Express delivery options are available at checkout for faster service.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Can I return an item?</AccordionTrigger>
              <AccordionContent>
                Yes, we accept returns within 30 days of purchase, provided the item is unused, unwashed, and in its original packaging with tags attached. Please see our Returns Policy for more details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                Currently, we only ship within Nigeria. We are working on expanding our shipping options to other countries soon.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>How can I track my order?</AccordionTrigger>
              <AccordionContent>
                Once your order is shipped, you will receive an email with a tracking number. You can use this number on our &quot;Track Order&quot; page to see the status of your delivery.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Do you offer gift wrapping?</AccordionTrigger>
              <AccordionContent>
                Yes, we offer premium gift wrapping services for a small additional fee. You can select this option at checkout.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-8">
              <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
              <AccordionContent>
                You can reach our customer support team via email at support@nadinekollections.com or through our &quot;Contact Us&quot; page. We are available Monday to Friday, 9 AM to 5 PM.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
