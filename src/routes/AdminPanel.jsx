import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ADMIN_UID = "5baa940b-c6b4-420c-9966-c02aa4c94f36";

export default function AdminPanel() {
  const { user } = UserAuth();
  const navigate = useNavigate();

  const [bugReports, setBugReports] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [reports, setReports] = useState([]);

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

    const { data: reportRows, error: reportsError } = await supabase
      .from("reports")
      .select("id, reason, created_at, post_id, reporter_id")
      .order("created_at", { ascending: false });

    if (bugError || featureError || reportsError) {
      console.error("Error fetching:", bugError || featureError || reportsError);
      return;
    }

    const postIds = (reportRows || []).map((r) => r.post_id).filter(Boolean);
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("id, text, user_id")
      .in("id", postIds.length > 0 ? postIds : ["00000000-0000-0000-0000-000000000000"]);

    if (postsError) {
      console.error("Error fetching posts:", postsError);
    }

    const reporterIds = (reportRows || []).map((r) => r.reporter_id).filter(Boolean);
    const postAuthorIds = (posts || []).map((p) => p.user_id).filter(Boolean);
    const userIds = [...new Set([...reporterIds, ...postAuthorIds])];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    const postMap = Object.fromEntries((posts || []).map((p) => [p.id, p]));
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    const enrichedReports = (reportRows || []).map((r) => {
      const post = postMap[r.post_id];
      const postAuthor = post ? profileMap[post.user_id] : null;
      const reporter = profileMap[r.reporter_id];

      return {
        ...r,
        post,
        postAuthor,
        reporter,
      };
    });

    setBugReports(bugs || []);
    setFeatureRequests(features || []);
    setReports(enrichedReports || []);
  };

  return (
    <div className="min-h-screen bg-[#d3b7a4] p-8 font-serif">
      <h1 className="text-4xl font-bold mb-6 text-center text-[#202d26]">admin panel</h1>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Bug Reports */}
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

        {/* Feature Requests */}
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

        {/* Reports */}
        <div className="bg-[#202d26] text-[#d3b7a4] rounded-xl p-6 shadow-md overflow-y-auto max-h-[80vh]">
          <h2 className="text-2xl font-semibold mb-4">User Reports</h2>
          {reports.length === 0 ? (
            <p>No reports submitted yet.</p>
          ) : (
            reports.map((r) => (
              <div key={r.id} className="mb-6 border-b border-[#d3b7a4] pb-4">
                <p className="text-sm italic mb-1">
                  Reported at: {new Date(r.created_at).toLocaleString()}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Reporter:</span>{" "}
                  {r.reporter?.username} ({r.reporter?.email})
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Post Author:</span>{" "}
                  {r.postAuthor?.username} ({r.postAuthor?.email})
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Post ID:</span> {r.post?.id}
                </p>
                <p className="mt-1 mb-2 whitespace-pre-wrap break-words border border-[#d3b7a4] rounded p-2 bg-[#2b3a32]">
                  {r.post?.text || "[No post text available]"}
                </p>
                <p className="text-sm italic">
                  <span className="font-semibold">Reason:</span> {r.reason || "No reason provided"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
