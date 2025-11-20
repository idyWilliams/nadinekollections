export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto bg-surface p-8 md:p-12 rounded-xl shadow-card border border-border-light">
        <h1 className="text-3xl font-bold mb-8">Returns & Refunds</h1>

        <div className="space-y-6 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Return Policy</h2>
            <p>
              Our return policy lasts 30 days. If 30 days have gone by since your purchase, unfortunately, we can’t offer you a refund or exchange.
            </p>
            <p className="mt-2">
              To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Non-returnable items</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gift cards</li>
              <li>Downloadable software products</li>
              <li>Some health and personal care items</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Refunds</h2>
            <p>
              Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
            </p>
            <p className="mt-2">
              If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Exchanges</h2>
            <p>
              We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at support@nadinekollections.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
