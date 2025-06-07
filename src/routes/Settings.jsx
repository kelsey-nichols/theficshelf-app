import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function SettingsPage() {
  const { user } = UserAuth();
  const userId = user?.id;

  // Change Email
  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");

  // Change Password
  const [passwords, setPasswords] = useState({ old: "", new1: "", new2: "" });
  const [pwMsg, setPwMsg] = useState("");

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new1 !== passwords.new2) {
      setPwMsg("New passwords do not match");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: passwords.new1 });
    if (error) setPwMsg(error.message);
    else setPwMsg("Password updated successfully.");
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
    const { error } = await supabase.auth.api.deleteUser(userId);
    if (error) setDelMsg(error.message);
    else setDelMsg("Account deleted.");
  };

  return (
    <div className="min-h-screen bg-[#d3b7a4] p-6 font-serif">
      <h1 className="text-3xl font-bold text-[#202d26] mb-6">settings</h1>

      <div className="space-y-4">
        <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-4">
          <summary className="cursor-pointer font-semibold">Theme Settings</summary>
          <p className="mt-2">Default theme enabled. More themes coming soon!</p>
        </details>

        <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-4">
          <summary className="cursor-pointer font-semibold">Account Info</summary>
          <div className="mt-4 space-y-6">
            <form onSubmit={handleChangeEmail} className="space-y-2">
              <label>New Email:</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2 rounded bg-[#dfdad6] text-[#202d26]"
              />
              <button type="submit" className="px-4 py-2 rounded bg-[#d3b7a4] text-[#202d26]">
                Update Email
              </button>
              {emailMsg && <p className="text-sm mt-1">{emailMsg}</p>}
            </form>
            <form onSubmit={handleChangePassword} className="space-y-2">
              <label>Old Password:</label>
              <input
                type="password"
                required
                value={passwords.old}
                onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                className="w-full p-2 rounded bg-[#dfdad6] text-[#202d26]"
              />
              <label>New Password:</label>
              <input
                type="password"
                required
                value={passwords.new1}
                onChange={(e) => setPasswords({ ...passwords, new1: e.target.value })}
                className="w-full p-2 rounded bg-[#dfdad6] text-[#202d26]"
              />
              <label>Confirm New Password:</label>
              <input
                type="password"
                required
                value={passwords.new2}
                onChange={(e) => setPasswords({ ...passwords, new2: e.target.value })}
                className="w-full p-2 rounded bg-[#dfdad6] text-[#202d26]"
              />
              <button type="submit" className="px-4 py-2 rounded bg-[#d3b7a4] text-[#202d26]">
                Change Password
              </button>
              {pwMsg && <p className="text-sm mt-1">{pwMsg}</p>}
            </form>
          </div>
        </details>

        <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-4" id="export">
          <summary className="cursor-pointer font-semibold">Data Export</summary>
          <div className="mt-2">
            <p>
              You can generate an Excel file of your logged fics at any point using the button below. This excel sheet is very simple but has pages
              for each shelf, showing basic information for each fic including link, dates read, etc. If you are planning on deleting your account, 
              please export your data first so you don't lose all your fics!
            </p>
            <button
              onClick={exportData}
              disabled={exporting}
              className="px-4 py-2 rounded bg-[#d3b7a4] text-[#202d26] hover:bg-[#b8a58b] disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </details>

        <details className="bg-[#202d26] text-[#d3b7a4] rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-[#9b5744]">Delete Account</summary>
          <div className="mt-2 space-y-3">
            <p>
              <strong>Want to delete your account?</strong> If you want to keep the fics you've logged,
              make sure you export your data above. Once you delete your account, <strong>there is no recovering this information.</strong>
            </p>
            <p>To confirm, type <strong>DELETE</strong> below.</p>
            <form onSubmit={handleDeleteAccount} className="space-y-2">
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                className="w-full p-2 rounded bg-[#dfdad6] text-[#202d26]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                disabled={deleteConfirm !== "DELETE"}
              >
                Delete My Account
              </button>
            </form>
            {delMsg && <p className="text-sm mt-1">{delMsg}</p>}
          </div>
        </details>
      </div>
    </div>
  );
}
