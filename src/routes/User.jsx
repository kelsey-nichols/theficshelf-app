import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { Ellipsis } from "lucide-react";
import { supabase } from "../supabaseClient";
import AnalyticsPanel from "./AnalyticsPanel";

const UserProfile = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [selectedOffset, setSelectedOffset] = useState(0);
  const handleMonthChange = (e) => setSelectedOffset(Number(e.target.value));

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [form, setForm] = useState({
    username: "",
    display_name: "",
    bio: "",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name, bio")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);
        setForm(profileData);

        const { count: followingCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("followers_id", session.user.id);

        const { count: followersCount } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", session.user.id);

        setFollowingCount(followingCount || 0);
        setFollowersCount(followersCount || 0);
      } catch (err) {
        console.error("Error fetching profile or follow data:", err.message);
        setError("Failed to load profile information.");
      }
    };

    fetchProfileData();
  }, [session]);

  // Corrected useEffect for words read
  useEffect(() => {
    const fetchWordsRead = async () => {
      if (!session?.user?.id) return;

      try {
        // Step 1: get all reading logs for user (all time)
        const { data: logs, error: logsError } = await supabase
          .from("reading_logs")
          .select("fic_id, read_ranges")
          .eq("user_id", session.user.id);

        if (logsError) throw logsError;
        if (!logs || logs.length === 0) {
          setWordsRead(0);
          return;
        }

        // Step 2: get unique fic IDs to reduce redundant queries
        const uniqueFicIds = [...new Set(logs.map((log) => log.fic_id))];

        // Step 3: fetch word counts for all fics
        const { data: ficsData, error: ficsError } = await supabase
          .from("fics")
          .select("id, words")
          .in("id", uniqueFicIds);

        if (ficsError) throw ficsError;

        // Map fic_id => words
        const wordsMap = new Map(ficsData.map((fic) => [fic.id, fic.words || 0]));

        // Step 4: sum words * number of rereads (length of read_ranges array)
        const totalWords = logs.reduce((sum, log) => {
          const words = wordsMap.get(log.fic_id) || 0;
          const rereadCount = Array.isArray(log.read_ranges) ? log.read_ranges.length : 0;
          return sum + words * rereadCount;
        }, 0);

        setWordsRead(totalWords);
      } catch (err) {
        console.error("Error calculating words read:", err.message);
        setWordsRead(0);
      }
    };

    fetchWordsRead();
  }, [session]);

  useEffect(() => {
  function handleClickOutside(event) {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


  const handleEditToggle = () => {
    setEditing(!editing);
    setError(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!session?.user?.id) {
      setError("User not authenticated.");
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from("profiles")
        .update({
          username: form.username,
          display_name: form.display_name,
          bio: form.bio,
        })
        .eq("id", session.user.id)
        .select();

      if (error) {
        setError(`Failed to update profile: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        setError("No profile updated, please check your user ID and permissions.");
        return;
      }

      setProfile(data[0]);
      setForm(data[0]);
      setEditing(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    }
  };

  return (
  <div className="min-h-screen flex flex-col items-center justify-start bg-[#d3b7a4] text-[#202d26] p-6 font-serif">
      {profile ? (
        <div className="w-full max-w-md text-center mt-10 space-y-4 border-b border-[#202d26]/20 pb-6 relative">
          {/* Ellipsis menu at top-right */}
          {!editing && (
            <div className="absolute -top-1 -right-2" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Open menu"
                className="hover:text-[#956342]"
              >
                <Ellipsis size={20} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[#202d26] rounded shadow-md text-[#d3b7a4] font-normal text-left z-10">
                  <button
                    onClick={handleEditToggle}
                    className="block w-full px-4 py-2 hover:bg-[#d3b7a4] hover:text-[#fff] rounded"
                  >
                    EDIT
                  </button>
                </div>
              )}
            </div>
          )}

          {editing ? (
            <>
              <input
                type="text"
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                placeholder="Display Name"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                className="w-full p-2 border rounded"
              />
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Bio"
                className="w-full p-2 border rounded"
              />
              <div className="flex gap-4 justify-center mt-2">
                <button
                  onClick={handleSave}
                  className="bg-[#202d26] text-[#d3b7a4] px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="border border-[#202d26] px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{profile.display_name}</h1>
              <p className="text-[#956342]">@{profile.username}</p>
              <p className="mt-2">{profile.bio}</p>

              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div>
                  <span className="font-semibold">{followingCount}</span>{" "}
                  <span className="text-[#956342]">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{followersCount}</span>{" "}
                  <span className="text-[#956342]">Followers</span>
                </div>
              </div>

              <p className="mt-2 text-sm text-[#202d26]/80">
                {wordsRead.toLocaleString()} words read
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="mt-10">Loading profile...</p>
      )}

      {error && <p className="text-red-500 mt-4">{error}</p>}

    <div className="my-4 flex items-center">
      <label className="mr-3 font-serif font-semibold text-[#856857]">
        Select Month:
      </label>
      <select
        value={selectedOffset}
        onChange={handleMonthChange}
        className="font-serif bg-[#e6d9c7] border-2 border-[#9c5845] rounded px-3 py-1 text-[#4a3a2a] focus:outline-none focus:ring-2 focus:ring-[#856857] transition"
      >
        <option value={0}>This Month</option>
        <option value={1}>Last Month</option>
      </select>
    </div>

    {/* Render analytics with that offset */}
    <AnalyticsPanel userId={session.user.id} monthOffset={selectedOffset} />
  </div>
);
};

export default UserProfile;

