import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Link } from "react-router-dom";

export default function SettingsPage() {
  const { user } = UserAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  // Change Email
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  // Export
  const [exporting, setExporting] = useState(false);

  // Delete Account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [delMsg, setDelMsg] = useState("");

  // Handlers
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) setEmailMsg(error.message);
    else setEmailMsg("Email updated successfully. Check your inbox.");
  };

  const exportData = async () => {
    setExporting(true);
    const { data: shelves, error: shelfError } = await supabase
      .from("shelves")
      .select("id, title")
      .eq("user_id", userId);
    if (shelfError) {
      console.error(shelfError);
      setExporting(false);
      return;
    }
    const workbook = XLSX.utils.book_new();
    for (const shelf of shelves) {
      const { data: logs, error: logError } = await supabase
        .from("reading_logs")
        .select(`
          read_ranges,
          notes,
          fics(
            title,
            author,
            link,
            summary,
            rating,
            archive_warning,
            category,
            words,
            hits,
            kudos,
            fic_fandoms(fandoms(name)),
            fic_characters(characters(name)),
            fic_relationships(relationships(name)),
            fic_tags(tags(name))
          )`
        )
        .eq("user_id", userId)
        .contains("shelves", [shelf.id]);
      if (logError) {
        console.error(logError);
        continue;
      }
      const rows = logs.map((log) => {
        const fic = log.fics || {};
        const fandoms = (fic.fic_fandoms || []).map((ff) => ff.fandoms.name).join(", ");
        const characters = (fic.fic_characters || []).map((fc) => fc.characters.name).join(", ");
        const relationships = (fic.fic_relationships || []).map((fr) => fr.relationships.name).join(", ");
        const tags = (fic.fic_tags || []).map((ft) => ft.tags.name).join(", ");
        return {
          Title: fic.title || "",
          Author: fic.author || "",
          Link: fic.link || "",
          Summary: fic.summary || "",
          Rating: fic.rating || "",
          "Archive Warning": Array.isArray(fic.archive_warning) ? fic.archive_warning.join(", ") : (fic.archive_warning || ""),
          Category: fic.category || "",
          Fandoms: fandoms,
          Characters: characters,
          Relationships: relationships,
          "Additional Tags": tags,
          Words: fic.words || "",
          Hits: fic.hits || "",
          Kudos: fic.kudos || "",
          "Reading Dates": Array.isArray(log.read_ranges) ? log.read_ranges.join(", ") : "",
          Notes: log.notes || "",
        };
      });
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const name = shelf.title.substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    }
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, "my_fic_shelf_data.xlsx");
    setExporting(false);
  };
  
const handleDeleteAccount = async (e) => {
  e.preventDefault();

  if (deleteConfirm !== "DELETE") {
    setDelMsg("Type DELETE to confirm");
    return;
  }

  // Confirm the user is logged in
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.id) {
    setDelMsg("No user ID found.");
    return;
  }

  try {
    // Call your Postgres function (RPC) that deletes the user securely server-side
    const { error: rpcError } = await supabase.rpc('delete_user');

    if (rpcError) {
      setDelMsg(`Delete failed: ${rpcError.message}`);
      return;
    }

    setDelMsg("Account deleted successfully.");

    // Sign out the user after deletion
    await supabase.auth.signOut();

    // Redirect or update UI after deletion
    navigate("/");

  } catch (err) {
    console.error("Unexpected error during delete:", err);
    setDelMsg("An unexpected error occurred.");
  }
};

  return (
  <div className="min-h-screen bg-[#d3b7a4] p-6 font-serif">
    <h1 className="text-3xl font-bold text-[#202d26] mb-8">Settings</h1>

    <div className="space-y-6">
      {/* Theme Settings */}
      <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-6">
        <summary className="cursor-pointer font-semibold text-lg">Theme Settings</summary>
        <div className="mt-4">
          <p className="leading-relaxed">
            Default theme enabled. More themes and dark mode coming soon!
          </p>
        </div>
      </details>

      {/* Account Info */}
      <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-6">
        <summary className="cursor-pointer font-semibold text-lg">Account Info</summary>
        <div className="mt-6 space-y-6">
          {/* Change Email */}
          <form onSubmit={handleChangeEmail} className="space-y-4">
            <label className="block font-medium">New Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-3 rounded bg-[#dfdad6] text-[#202d26] focus:outline-none focus:ring-2 focus:ring-[#886146]"
            />
            <button
              type="submit"
              className="inline-block px-6 py-2 bg-[#d3b7a4] text-[#202d26] rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition"
            >
              Update Email
            </button>
            {emailMsg && <p className="mt-2 text-sm">{emailMsg}</p>}
          </form>

          {/* Reset Password */}
          <div className="border-t border-[#886146] pt-6">
            <p className="mb-2">To change your password, send yourself a magic-link:</p>
            <Link
              to="/forgot-password"
              className="inline-block px-5 py-2 bg-[#886146] text-[#d3b7a4] rounded-full font-semibold hover:bg-[#a07a5f] transition"
            >
              Send Reset Link
            </Link>
          </div>
        </div>
      </details>

      {/* Data Export */}
      <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-6">
        <summary className="cursor-pointer font-semibold text-lg">Data Export</summary>
        <div className="mt-4 space-y-4">
          <p className="leading-relaxed">
            Export your reading logs and shelf data as an Excel workbook. Useful before deleting your account!
          </p>
          <button
            onClick={exportData}
            disabled={exporting}
            className="px-6 py-2 bg-[#d3b7a4] text-[#202d26] rounded-full font-semibold hover:bg-[#b8a58b] transition disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export to Excel"}
          </button>
        </div>
      </details>

      {/* Delete Account */}
      <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-6">
        <summary className="cursor-pointer font-semibold text-lg text-[#9b5744]">
          Delete Account
        </summary>
        <div className="mt-6 space-y-4">
          <p className="leading-relaxed">
            <strong>Warning:</strong> Deleting your account cannot be undone. Export your data first if you wish to keep it.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label className="block mb-1">Type <strong>DELETE</strong> to confirm:</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full p-3 rounded bg-[#dfdad6] text-[#202d26] focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <button
              type="submit"
              disabled={deleteConfirm !== "DELETE"}
              className="inline-block px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition disabled:opacity-50"
            >
              Delete My Account
            </button>
          </form>
          {delMsg && <p className="mt-2 text-sm">{delMsg}</p>}
        </div>
      </details>
    </div>
  </div>
);

}
