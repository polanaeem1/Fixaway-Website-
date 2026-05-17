import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Fixaway Terms of Service governing your use of our home maintenance and roadside assistance marketplace.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-primary mb-2">Terms of Service</h1>
      <p className="text-on-surface-variant text-sm mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-on-surface leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-primary mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Fixaway (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the Platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">2. Service Description</h2>
          <p>Fixaway is an online marketplace that connects customers requiring home maintenance and roadside assistance services with independent service technicians. Fixaway acts as an intermediary and is not responsible for the quality of services provided by technicians.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">3. User Accounts</h2>
          <p>You must register for an account to use core Platform features. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must provide accurate and complete information during registration.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">4. Payments & Wallet</h2>
          <p>All transactions are processed through the Fixaway Wallet system. Customers must maintain sufficient balance to accept quotes. Funds are released to technicians only upon job completion confirmation. Fixaway charges a platform fee on each completed transaction.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">5. Emergency Services</h2>
          <p>The SOS / roadside emergency feature dispatches your GPS coordinates to nearby verified technicians. By using this feature, you consent to the collection and temporary processing of your location data for the sole purpose of connecting you with assistance.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">6. Prohibited Conduct</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Posting false, misleading, or fraudulent service requests</li>
            <li>Attempting to transact outside the Platform to avoid fees</li>
            <li>Harassment of technicians, customers, or Fixaway staff</li>
            <li>Using the Platform for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">7. Limitation of Liability</h2>
          <p>Fixaway is not liable for any damages arising from the acts or omissions of technicians. The Platform is provided &quot;as is&quot; without warranties of any kind. Our aggregate liability shall not exceed the total fees paid to Fixaway in the 30 days preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">8. Changes to Terms</h2>
          <p>Fixaway reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the new Terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">9. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:legal@fixaway.com" className="text-primary underline">legal@fixaway.com</a>.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-outline-variant/20 flex gap-4">
        <Link href="/privacy" className="text-primary text-sm font-semibold hover:underline">Privacy Policy</Link>
        <Link href="/" className="text-on-surface-variant text-sm hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
