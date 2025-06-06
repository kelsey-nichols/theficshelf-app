import { useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

export default function ContactUsPage() {
  const { user } = UserAuth();
  const userId = user?.id ?? null;

  // ─── Bug Report form state ─────────────────────────────────────────────────────────
  const [bugEmail, setBugEmail] = useState(user?.email ?? "");
  const [bugDescription, setBugDescription] = useState("");
  const [bugSuccess, setBugSuccess] = useState(null);
  const [bugLoading, setBugLoading] = useState(false);

  // ─── Feature Request form state ────────────────────────────────────────────────────
  const [featureEmail, setFeatureEmail] = useState(user?.email ?? "");
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [featureSuccess, setFeatureSuccess] = useState(null);
  const [featureLoading, setFeatureLoading] = useState(false);

  // ─── Handle Bug Report submit ──────────────────────────────────────────────────────
  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setBugLoading(true);
    const { error } = await supabase.from("bug_reports").insert({
      user_id: userId,
      email: bugEmail || null,
      description: bugDescription,
    });
    setBugLoading(false);

    if (error) {
      setBugSuccess("Error submitting bug report.");
    } else {
      setBugSuccess("Bug report submitted successfully!");
      setBugDescription("");
    }
  };

  // ─── Handle Feature Request submit ───────────────────────────────────────────────
  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    setFeatureLoading(true);
    const { error } = await supabase.from("feature_requests").insert({
      user_id: userId,
      email: featureEmail || null,
      title: featureTitle,
      description: featureDescription,
    });
    setFeatureLoading(false);

    if (error) {
      setFeatureSuccess("Error submitting feature request.");
    } else {
      setFeatureSuccess("Feature request submitted successfully!");
      setFeatureTitle("");
      setFeatureDescription("");
    }
  };

return (
    <div className="bg-[#d3b7a4] py-10 px-4">
      {/* Container only as wide as content, centered horizontally */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-12 lg:space-y-0">
          {/* ─── 1) Bug / Issue Form ───────────────────────────────────────────────── */}
          <form
            onSubmit={handleBugSubmit}
            className="w-full bg-[#202d26] text-[#d3b7a4] shadow-md space-y-6 font-serif rounded-xl p-8"
          >
            <h2 className="text-3xl font-semibold text-[#d3b7a4] mb-4">
              Report a Bug or Issue
            </h2>
            <p className="text-sm text-[#d3b7a4] mb-4">
              Use this form to report problems like errors on the site, issues with logging in or registering,
              broken forms, or pages not working as expected. Please be as detailed as possible:
              include your email (if you’re not logged in), username, which page you’re on,
              what went wrong, and how to reproduce it.
            </p>

            {!user && (
              <div>
                <label className="block mb-2 font-medium text-[#d3b7a4]">
                  Your Email (optional):
                </label>
                <input
                  type="email"
                  value={bugEmail}
                  onChange={(e) => setBugEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </div>
            )}

            <div>
              <label className="block mb-2 font-medium text-[#d3b7a4]">
                Description of Issue:
              </label>
              <textarea
                required
                value={bugDescription}
                onChange={(e) => setBugDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={5}
                className="w-full resize-y bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
              />
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={bugLoading}
                className={`px-6 py-2 rounded-md text-[#202d26] font-semibold ${
                  bugLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#d3b7a4] hover:bg-[#6f4b34]"
                }`}
              >
                {bugLoading ? "Submitting..." : "Submit Bug Report"}
              </button>
            </div>

            {bugSuccess && <p className="text-sm text-center mt-2">{bugSuccess}</p>}
          </form>

          {/* ─── 2) Feature Request Form ──────────────────────────────────────────────── */}
          <form
            onSubmit={handleFeatureSubmit}
            className="w-full bg-[#202d26] text-[#d3b7a4] shadow-md space-y-6 font-serif rounded-xl p-8"
          >
            <h2 className="text-3xl font-semibold text-[#d3b7a4] mb-4">
              Suggest a Feature
            </h2>
            <p className="text-sm text-[#d3b7a4] mb-4">
              Have an idea to improve the app or a feature you’d love to see? Share it here!
              If you include your email and we implement your suggestion, we’ll notify you when it’s live.
            </p>

            {!user && (
              <div>
                <label className="block mb-2 font-medium text-[#d3b7a4]">
                  Your Email (optional):
                </label>
                <input
                  type="email"
                  value={featureEmail}
                  onChange={(e) => setFeatureEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
                />
              </div>
            )}

            <div>
              <label className="block mb-2 font-medium text-[#d3b7a4]">
                Feature Title:
              </label>
              <input
                required
                type="text"
                value={featureTitle}
                onChange={(e) => setFeatureTitle(e.target.value)}
                placeholder="Short title for your suggestion"
                className="w-full bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-[#d3b7a4]">
                Description:
              </label>
              <textarea
                required
                value={featureDescription}
                onChange={(e) => setFeatureDescription(e.target.value)}
                placeholder="Explain your suggestion in detail..."
                rows={5}
                className="w-full resize-y bg-[#dfdad6] border-2 placeholder-[#886146] border-[#886146] text-[#202d26] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3b7a4]"
              />
            </div>

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={featureLoading}
                className={`px-6 py-2 rounded-md text-[#202d26] font-semibold ${
                  featureLoading ? "bg-gray-400 cursor-not-allowed" : "bg-[#d3b7a4] hover:bg-[#6f4b34]"
                }`}
              >
                {featureLoading ? "Submitting..." : "Submit Feature Request"}
              </button>
            </div>

            {featureSuccess && <p className="text-sm text-center mt-2">{featureSuccess}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}