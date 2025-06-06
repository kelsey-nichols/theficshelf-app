import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ADMIN_UID = "5baa940b-c6b4-420c-9966-c02aa4c94f36";

export default function AdminPanel() {
  const { user, session } = UserAuth();
  const navigate = useNavigate();

  const [bugReports, setBugReports] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (user.id !== ADMIN_UID) {
      navigate("/"); // Redirect non-admin users
    } else {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const { data: bugs, error: bugError } = await supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: features, error: featureError } = await supabase
      .from("feature_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (bugError || featureError) {
      console.error("Error fetching:", bugError || featureError);
    } else {
      setBugReports(bugs || []);
      setFeatureRequests(features || []);
    }
  };

  return (
    <div className="min-h-screen bg-[#d3b7a4] p-8 font-serif">
      <h1 className="text-4xl font-bold mb-6 text-center text-[#202d26]">Admin Panel</h1>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* ─── Bug Reports ───────────────────────────────── */}
        <div className="bg-[#202d26] text-[#d3b7a4] rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Bug Reports</h2>
          {bugReports.length === 0 ? (
            <p>No bug reports submitted yet.</p>
          ) : (
            bugReports.map((report) => (
              <div key={report.id} className="mb-6 border-b border-[#d3b7a4] pb-4">
                {report.email && <p className="text-sm">Email: {report.email}</p>}
                <p className="text-sm italic">Submitted: {new Date(report.created_at).toLocaleString()}</p>
                <p className="mt-2">{report.description}</p>
              </div>
            ))
          )}
        </div>

        {/* ─── Feature Requests ─────────────────────────── */}
        <div className="bg-[#202d26] text-[#d3b7a4] rounded-xl p-6 shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Feature Requests</h2>
          {featureRequests.length === 0 ? (
            <p>No feature requests submitted yet.</p>
          ) : (
            featureRequests.map((req) => (
              <div key={req.id} className="mb-6 border-b border-[#d3b7a4] pb-4">
                {req.email && <p className="text-sm">Email: {req.email}</p>}
                <p className="font-semibold">{req.title}</p>
                <p className="text-sm italic">Submitted: {new Date(req.created_at).toLocaleString()}</p>
                <p className="mt-2">{req.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
