import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Fixaway collects, uses, and protects your personal data when using our marketplace.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
      <p className="text-on-surface-variant text-sm mb-10">Last updated: May 2026</p>

      <div className="space-y-8 text-on-surface leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-primary mb-3">1. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> Name, email, phone number, and role (customer/technician)</li>
            <li><strong>Location data:</strong> GPS coordinates collected when you submit a service request or use the SOS feature</li>
            <li><strong>Transaction data:</strong> Payment history, wallet balance, and earnings records</li>
            <li><strong>Usage data:</strong> Pages visited, features used, and device information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To match customers with nearby technicians</li>
            <li>To process payments and maintain wallet balances</li>
            <li>To send service-related notifications</li>
            <li>To detect and prevent fraudulent activity</li>
            <li>To improve Platform performance and features</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">3. Location Data</h2>
          <p>Location data is collected only when you actively submit a service request or activate the SOS emergency feature. We do not continuously track your location. Location data is shared only with the technician assigned to your request.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">4. Data Sharing</h2>
          <p>We do not sell your personal data. We share data with:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Technicians: Your name, address, and service details for job fulfillment</li>
            <li>Payment processors: For wallet and transaction operations</li>
            <li>Service providers: Infrastructure, hosting, and analytics partners</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">5. Data Retention</h2>
          <p>We retain account data for as long as your account is active. Transaction records are retained for 7 years for legal compliance. You may request deletion of your account and associated data by contacting us.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact <a href="mailto:privacy@fixaway.com" className="text-primary underline">privacy@fixaway.com</a>.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">7. Security</h2>
          <p>We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and access controls. However, no system is 100% secure — please use a strong, unique password for your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-primary mb-3">8. Contact</h2>
          <p>For privacy-related inquiries, contact <a href="mailto:privacy@fixaway.com" className="text-primary underline">privacy@fixaway.com</a>.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-outline-variant/20 flex gap-4">
        <Link href="/terms" className="text-primary text-sm font-semibold hover:underline">Terms of Service</Link>
        <Link href="/" className="text-on-surface-variant text-sm hover:underline">← Back to Home</Link>
      </div>
    </div>
  );
}
