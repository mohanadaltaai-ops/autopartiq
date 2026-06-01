import React from 'react';
import { getMarketAppName, getMarketCode, getMarketSupportEmail } from '../lib/market';

function LegalShell({ title, subtitle, children }) {
  const appName = getMarketAppName('en');
  const supportEmail = getMarketSupportEmail();

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#F7F9FD] text-slate-950 px-5 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-[30px] bg-white border border-slate-200 shadow-sm p-6 mb-5">
          <div className="inline-flex px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-black">
            {appName}
          </div>
          <h1 className="text-3xl font-black mt-4 leading-tight">{title}</h1>
          <p className="text-sm font-semibold text-slate-500 mt-2">{subtitle}</p>
          <p className="text-xs font-bold text-slate-400 mt-4">Last updated: May 2026</p>
        </div>

        <div className="rounded-[30px] bg-white border border-slate-200 shadow-sm p-6 space-y-6 text-sm leading-7">
          {children}

          <section>
            <h2 className="text-xl font-black mb-2">Contact</h2>
            <p>
              For support, privacy questions, or account deletion requests, contact us at{' '}
              <a className="text-blue-700 font-black break-all" href={`mailto:${supportEmail}`}>
                {supportEmail}
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicy() {
  const appName = getMarketAppName('en');
  const marketCode = getMarketCode();

  return (
    <LegalShell
      title="Privacy Policy"
      subtitle={`How ${appName} collects, uses, stores, and protects user information.`}
    >
      <section>
        <h2 className="text-xl font-black mb-2">1. Who We Are</h2>
        <p>
          {appName} is a spare parts marketplace application that connects customers, suppliers,
          and operations teams. {marketCode === 'AE' ? 'PartLink AE serves the United Arab Emirates market.' : 'PartLink IQ serves the Iraq market.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">2. Information We Collect</h2>
        <p>Depending on your role and how you use the app, we may collect:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Account information such as phone number, email address, role, market, and login details.</li>
          <li>Vehicle information such as make, model, year, origin, and saved vehicle preferences.</li>
          <li>Spare parts request details such as part name, description, photos, quantity, and delivery requirements.</li>
          <li>Supplier offer details such as price, availability, delivery time, notes, and order status.</li>
          <li>Order information such as accepted offers, delivery status, payment status, and operational notes.</li>
          <li>Notifications and app activity related to requests, offers, orders, and account actions.</li>
          <li>Technical information needed to operate and secure the app.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">3. How We Use Information</h2>
        <p>
          We use information to create and manage accounts, authenticate users, match customer
          requests with relevant suppliers, manage offers and orders, support admin operations,
          send service-related notifications, improve app reliability, prevent fraud, and comply
          with legal or regulatory obligations.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">4. Sharing of Information</h2>
        <p>
          We may share limited information between customers, suppliers, and admins where needed
          for the marketplace to function. We may also use trusted service providers for hosting,
          authentication, database services, OTP/email delivery, analytics, error monitoring,
          and app operations. We do not sell user personal data.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">5. Data Retention</h2>
        <p>
          We keep user data for as long as needed to provide the service, operate the marketplace,
          resolve disputes, maintain records, prevent fraud, and meet legal or regulatory
          requirements. Some order, transaction, settlement, audit, or compliance records may need
          to be retained even after an account deletion request.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">6. Account Deletion</h2>
        <p>
          Users may request deletion of their account and associated personal data from the Profile
          page inside the app or by contacting support. When we receive a deletion request, we will
          review and process it within a reasonable period. Some data may be retained where required
          for legal, fraud prevention, dispute resolution, financial, audit, or regulatory reasons.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">7. Security</h2>
        <p>
          We use reasonable technical and organizational measures to protect user information,
          including access controls, authentication, and secure hosting practices. No system is
          completely secure, and users should keep their login details and devices protected.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Updated versions will be posted in
          the app or on our official website.
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsOfUse() {
  const appName = getMarketAppName('en');
  const marketCode = getMarketCode();

  return (
    <LegalShell
      title="Terms of Use"
      subtitle={`Rules and responsibilities for using ${appName}.`}
    >
      <section>
        <h2 className="text-xl font-black mb-2">1. Service Overview</h2>
        <p>
          {appName} is a spare parts marketplace platform that allows customers to submit spare
          parts requests and suppliers to submit offers. {marketCode === 'AE' ? 'PartLink AE serves the United Arab Emirates market.' : 'PartLink IQ serves the Iraq market.'}
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">2. User Roles</h2>
        <p>
          The app may include different user roles, including customers, suppliers, orders admins,
          full admins, super admins, and app owner users. Each role may have different permissions
          and responsibilities.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">3. User Responsibilities</h2>
        <p>
          Users agree to provide accurate information, use the app only for lawful purposes, avoid
          false or fraudulent requests or offers, keep their account access secure, respect other
          users, and comply with applicable laws and marketplace rules.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">4. Supplier Responsibilities</h2>
        <p>
          Suppliers are responsible for providing accurate offer prices and availability, supplying
          parts as described, meeting agreed delivery or pickup terms, updating order status
          accurately, and complying with applicable business, tax, and consumer protection laws.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">5. Customer Responsibilities</h2>
        <p>
          Customers are responsible for providing accurate vehicle and part information, reviewing
          supplier offers carefully, accepting offers only when they intend to proceed, and providing
          correct delivery or contact information where required.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">6. Orders and Payments</h2>
        <p>
          The app may support order management, delivery tracking, payment status, and settlement
          workflows. Specific payment, refund, delivery, or cancellation rules may be provided
          separately depending on the market and operational model.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">7. Marketplace Role</h2>
        <p>
          PartLink provides a technology platform to connect customers and suppliers. Unless
          separately stated, PartLink is not the manufacturer of parts listed or supplied by
          suppliers.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">8. Account Suspension or Termination</h2>
        <p>
          We may suspend or restrict accounts that violate these Terms, misuse the app, submit
          fraudulent information, or create operational or security risks.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black mb-2">9. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the app after updates means
          you accept the updated Terms.
        </p>
      </section>
    </LegalShell>
  );
}

