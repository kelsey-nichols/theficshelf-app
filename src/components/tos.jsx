import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Tos = () => {
  const navigate = useNavigate();
  const handleBack = () => {
 // If there's at least one previous entry in history
  if (window.history.length > 1) {
     navigate(-1);
   } else {
     navigate("/");
  }
 };

  return (
    <div className="min-h-screen bg-[#202d26] px-6 py-10 font-serif text-[#202d26]">
      <div
        className="max-w-4xl mx-auto mt-16 p-6 bg-[#d3b7a4] border-3 border-[#202d26] shadow-lg overflow-y-auto"
        style={{ height: '70vh', lineHeight: 1.6, fontSize: '1rem', color: '#202d26' }}
      >
        <h1 className="text-3xl font-bold mb-4">Terms of Service & Data Policy</h1>
        <p className="mb-6 italic">Effective Date: May 21, 2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p>
            Welcome to <strong>The Fic Shelf</strong>! I’m Kelsey Nichols, a reader and writer of fanfiction for over 15 years. This is an open source platform designed as a companion to Archive of Our Own (AO3) for logging, tracking,
            and organizing your favorite fanworks. By using this service, you agree to these Terms of Service and Data Policy.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2. Scope & Relationship with AO3</h2>
          <p>
            <strong>The Fic Shelf</strong> is independent and not affiliated with the Organization for Transformative Works (OTW) or AO3. We
            do not store, scrape, or host any fanfiction content. All entries on this site are user-provided links and metadata pointing back to AO3.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3. User Accounts & Data Rights</h2>
          <p>
            We respect your privacy and data ownership:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li><strong>Ownership:</strong> All data you enter (shelves, fics, notes, reading logs) remain yours at all times.</li>
            <li><strong>Data Portability:</strong> Use the Export feature to download your data as an Excel file with separate sheets per shelf.</li>
            <li><strong>Account Deletion:</strong> You may delete your account at any time. Upon deletion, all personal data will be permanently removed from our systems.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4. Data Policy & Compliance</h2>
          <p>
            We adhere to best practices for user data:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li><strong>No Selling:</strong> We will never sell, rent, or lease your personal information to third parties.</li>
            <li><strong>Minimal Collection:</strong> We collect only what is necessary to provide our services (e.g., email for password recovery).
            </li>
            <li><strong>Security:</strong> We use industry-standard encryption (HTTPS, Supabase security rules) to protect your data in transit and at rest.</li>
            <li><strong>Transparency:</strong> Any future data usage changes will be communicated and consent requested.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5. Donations & Voluntary Support</h2>
          <p>
            The Fic Shelf is free to use—no features are hidden behind a paywall. We gratefully accept voluntary donations via Stripe to cover hosting, database, and development costs. Donations are entirely optional and do not grant additional privileges.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6. User Responsibilities</h2>
          <ul className="list-disc list-inside mb-4">
            <li>Use the app for personal, non-commercial purposes only.</li>
            <li>Do not attempt to scrape or circumvent AO3’s platform.</li>
            <li>Respect the rights of fan creators and AO3’s community guidelines.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7. Intellectual Property & Licensing</h2>
          <p>
            All fanfiction works and metadata belong to their respective authors and AO3. This site displays user-entered text and links under fair use for personal reference only.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">8. Warranty Disclaimer</h2>
          <p>
            This service is provided “as-is” without warranties. We strive for reliable performance but do not guarantee uninterrupted access or error-free operation.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">9. Changes to Terms</h2>
          <p>
            We may update these Terms or Data Policy. We will post changes here with a revised “Effective Date” and send notifications within the app.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Contact & Support</h2>
          <p>
            Questions or concerns? Reach out at <a href="mailto:support@theficshelf.app" className="underline">support@theficshelf.app</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Tos;