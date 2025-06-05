import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
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

  useEffect(() => {
    const fetchWordsRead = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: shelfData, error: shelfError } = await supabase
          .from("shelves")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("title", "Archive")
          .single();

        if (shelfError || !shelfData) {
          console.warn("Archive shelf not found.");
          return;
        }

        const archiveShelfId = shelfData.id;

        const { data: shelfFics, error: shelfFicsError } = await supabase
          .from("shelf_fic")
          .select("fic_id")
          .eq("shelf_id", archiveShelfId);

        if (shelfFicsError) throw shelfFicsError;

        const ficIds = shelfFics.map((item) => item.fic_id);

        if (ficIds.length === 0) {
          setWordsRead(0);
          return;
        }

        const { data: ficsData, error: ficsError } = await supabase
          .from("fics")
          .select("words")
          .in("id", ficIds);

        if (ficsError) throw ficsError;

        const totalWords = ficsData.reduce((sum, fic) => sum + (fic.words || 0), 0);
        setWordsRead(totalWords);
      } catch (err) {
        console.error("Error fetching word count:", err.message);
      }
    };

    fetchWordsRead();
  }, [session]);

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
      <div className="w-full max-w-md text-center mt-10 space-y-4 border-b border-[#202d26]/20 pb-6">
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

            <button
              onClick={handleEditToggle}
              className="mt-4 border border-[#202d26] px-4 py-2 rounded hover:bg-[#202d26] hover:text-[#d3b7a4]"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
    ) : (
      <p className="mt-10">Loading profile...</p>
    )}

    {error && <p className="text-red-500 mt-4">{error}</p>}

    {/* ─── Dropdown to pick which offset ───────────────── */}
    <div className="my-4">
      <label className="mr-2 font-semibold">Select Month:</label>
      <select
        value={selectedOffset}
        onChange={handleMonthChange}
        className="border rounded px-2 py-1"
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

