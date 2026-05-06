import { Router } from 'express';

const router = Router();

const updatedAt = '2026-05-06';

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | AutoParts IQ</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
    }
    main {
      max-width: 860px;
      margin: 0 auto;
      padding: 32px 20px;
    }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      padding: 28px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    }
    h1 {
      margin-top: 0;
      font-size: 30px;
    }
    h2 {
      margin-top: 28px;
      font-size: 20px;
    }
    a {
      color: #ea580c;
      font-weight: 700;
    }
    .muted {
      color: #64748b;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main>
    <div class="card">
      <h1>${title}</h1>
      <p class="muted">Last updated: ${updatedAt}</p>
      ${body}
    </div>
  </main>
</body>
</html>`;
}

router.get('/terms', (_, res) => {
  res.type('html').send(page('Terms and Conditions', `
    <p>Welcome to AutoParts IQ. By using our application and services, you agree to these Terms and Conditions.</p>

    <h2>1. Service Overview</h2>
    <p>AutoParts IQ helps customers request vehicle parts and allows suppliers to review matching requests, submit offers, and manage related orders.</p>

    <h2>2. User Responsibilities</h2>
    <p>Users must provide accurate information when creating requests, submitting offers, managing orders, or communicating through the platform.</p>

    <h2>3. Suppliers and Offers</h2>
    <p>Suppliers are responsible for the accuracy of their offers, including part details, pricing, availability, and delivery expectations.</p>

    <h2>4. Orders and Payments</h2>
    <p>AutoParts IQ currently supports cash-on-delivery and manual settlement workflows. Online payment integrations may be added later.</p>

    <h2>5. Cancellations and Disputes</h2>
    <p>Requests, offers, or orders may be cancelled according to the workflow available in the app. Any dispute should be reported to support for review.</p>

    <h2>6. Acceptable Use</h2>
    <p>Users must not misuse the platform, submit false information, attempt unauthorized access, or interfere with the operation of the service.</p>

    <h2>7. Changes to the Service</h2>
    <p>We may update, improve, suspend, or modify parts of the service from time to time.</p>

    <h2>8. Contact</h2>
    <p>For questions about these terms, contact us at <a href="mailto:support@autopartiq.com">support@autopartiq.com</a>.</p>
  `));
});

router.get('/privacy', (_, res) => {
  res.type('html').send(page('Privacy Policy', `
    <p>This Privacy Policy explains how AutoParts IQ collects, uses, and protects information when you use our application and services.</p>

    <h2>1. Information We Collect</h2>
    <p>We may collect account details such as name, phone number, email address, role, supplier information, request details, order details, location/delivery information, uploaded images, and support communications.</p>

    <h2>2. How We Use Information</h2>
    <p>We use information to provide the platform, match customers with suppliers, process requests and offers, manage orders, provide support, improve service quality, and maintain platform safety.</p>

    <h2>3. Uploaded Images</h2>
    <p>Images uploaded by users may be used to help identify parts, support requests, offers, delivery, or proof-of-delivery workflows.</p>

    <h2>4. Data Sharing</h2>
    <p>Relevant request and order information may be shared between customers, suppliers, admins, and delivery/support personnel as needed to provide the service.</p>

    <h2>5. Data Retention</h2>
    <p>We retain data for as long as needed to provide the service, comply with legal or operational requirements, resolve disputes, and maintain accurate transaction records.</p>

    <h2>6. Security</h2>
    <p>We apply reasonable technical and organizational measures to protect user information. No system is completely secure, and users should protect their own account access.</p>

    <h2>7. Account and Data Deletion</h2>
    <p>Users may request account and related personal data deletion from inside the app or through our account deletion page.</p>

    <h2>8. Contact</h2>
    <p>For privacy questions, contact us at <a href="mailto:support@autopartiq.com">support@autopartiq.com</a>.</p>
  `));
});

router.get('/account-deletion', (_, res) => {
  res.type('html').send(page('Account Deletion', `
    <p>AutoParts IQ users can request deletion of their account and related personal data.</p>

    <h2>How to Request Deletion</h2>
    <p>You can request deletion from inside the app by opening Profile, then using the account deletion request option.</p>
    <p>You can also email us directly at <a href="mailto:support@autopartiq.com?subject=AutoParts%20IQ%20account%20deletion%20request">support@autopartiq.com</a>.</p>

    <h2>Information to Include</h2>
    <p>Please include your registered phone number, name, and account role, such as Customer, Supplier, Admin, or Super Admin.</p>

    <h2>What Happens Next</h2>
    <p>Our support team will review your request, verify account ownership where required, and process deletion according to operational and legal requirements.</p>

    <h2>Data That May Be Retained</h2>
    <p>Some transaction, audit, order, payout, or compliance records may need to be retained where required for legal, security, fraud prevention, accounting, or dispute-resolution purposes.</p>

    <h2>Contact</h2>
    <p>For deletion requests or questions, contact <a href="mailto:support@autopartiq.com">support@autopartiq.com</a>.</p>
  `));
});

export default router;
