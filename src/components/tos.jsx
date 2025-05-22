import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Tos = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use state passed in navigation or fallback to dashboard/home
  const from = location.state?.from || "/";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(from);
    }
  };

  return (
    <div
      className="min-h-screen relative px-6 py-10 font-serif"
      style={{ backgroundColor: "#202d26", color: "#202d26"}}
    >
      {/* Back button top-left */}
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="absolute top-6 left-6 text-xl font-bold cursor-pointer"
        style={{ color: "#d3b7a4", background: "transparent", border: "none" }}
      >
        ← return
      </button>

      {/* Terms content box */}
      <div
        className="max-w-4xl mx-auto mt-16 p-6  shadow-lg"
        style={{
          backgroundColor: "#d3b7a4",
          border: "3px solid #202d26",
          height: "70vh",
          overflowY: "auto",
          lineHeight: 1.6,
          fontSize: "1.1rem",
        }}
      >
        <h1 className="text-3xl font-bold mb-4">Terms of Service for The Fic Shelf</h1>
        <p className="mb-6 italic">Effective Date: 05/21/2025</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">1 - Introduction</h2>
          <p>
            Hello! I’m Kelsey Nichols, the creator of The Fic Shelf, a longtime reader and writer of fanfiction for over eighteen years. I built this app to give fans like me a simple, respectful way to log, track, and engage with fanfiction content hosted on Archive of Our Own (AO3). The Fic Shelf is not a replacement for AO3, nor does it scrape, host, or reproduce any fanworks. It is a companion tool designed to support your experience and preserve the integrity of AO3’s incredible space for transformative works.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">2 - Relationship with AO3</h2>
          <p>
            The Fic Shelf is fully compliant with AO3’s Terms of Service. We do not store or rehost any AO3 content, and we do not interfere with AO3's infrastructure or operations in any way. This app interacts only with manually entered content and links and does not claim ownership of any fanworks, content, or trademarks associated with AO3, the Organization for Transformative Works (OTW), or any fandoms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">3 - User Accounts and Data</h2>
          <p>We believe your data belongs to you. Here’s how we protect it:</p>
          <ul className="list-disc list-inside mb-4">
            <li><strong>Data Privacy:</strong> We do not sell, share, or monetize your personal information or usage data.</li>
            <li><strong>Data Portability:</strong> You can export your data at any time through the app’s settings.</li>
            <li><strong>Account Deletion:</strong> You have the right to delete your account and all associated data permanently at any time.</li>
            <li><strong>Data Use:</strong> Your data is used solely to power features like personal logging, reading history, and tagging. It is never shared with third parties.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">4 - Your Responsibilities</h2>
          <p>By using The Fic Shelf, you agree to:</p>
          <ul className="list-disc list-inside">
            <li>Use the app only for personal, non-commercial purposes.</li>
            <li>Not abuse, reverse-engineer, or attempt to scrape AO3 content using this app.</li>
            <li>Respect other fans, creators, and AO3’s mission.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">5 - Intellectual Property</h2>
          <p>
            The Fic Shelf does not claim ownership over any fanworks or metadata. Any titles, authors, summaries, or links displayed in the app are presented strictly for personal, non-commercial use in accordance with AO3's guidelines and copyright best practices. All rights remain with the original creators and AO3.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">6 - Disclaimer</h2>
          <p>
            The Fic Shelf is an independent project and is not affiliated with AO3 or the OTW. This app is provided “as is” without warranties of any kind. While we strive for a smooth, respectful experience, we make no guarantees regarding accuracy, availability, or uninterrupted service.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-2">7 - Changes to These Terms</h2>
          <p>
            We may update these Terms of Service from time to time. When we do, we’ll notify you in the app and update the "Effective Date" at the top of this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8 - Contact</h2>
          <p>
            Got a question, concern, or fanfic rec? Reach out to us at [your email address or contact link].
          </p>
        </section>
      </div>
    </div>
  );
};

export default Tos;
