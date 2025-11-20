export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto bg-surface p-8 md:p-12 rounded-xl shadow-card border border-border-light">
        <h1 className="text-3xl font-bold mb-8">Shipping Policy</h1>

        <div className="space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Processing Time</h2>
            <p>
              All orders are processed within 1-3 business days. Orders are not shipped or delivered on weekends or holidays.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Shipping Rates & Delivery Estimates</h2>
            <p>
              Shipping charges for your order will be calculated and displayed at checkout.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Standard Shipping (3-5 business days): ₦2,500</li>
              <li>Express Shipping (1-2 business days): ₦5,000</li>
              <li>Free Shipping on orders over ₦100,000</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Shipment Confirmation & Order Tracking</h2>
            <p>
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Damages</h2>
            <p>
              NadineKollections is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
