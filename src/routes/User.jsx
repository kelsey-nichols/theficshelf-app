import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const UserProfile = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
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
        setForm(profileData); // preload form

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
    console.log("Attempting update for user id:", session.user.id);
    const { data, error, status } = await supabase
      .from("profiles")
      .update({
        username: form.username,
        display_name: form.display_name,
        bio: form.bio,
      })
      .eq("id", session.user.id)
      .select();  // <-- this is key to get updated data back

    console.log("Update result:", { data, error, status });

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
    </div>
  );
};

export default UserProfile;
