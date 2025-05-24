import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const UserProfile = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, bio")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error.message);
        setError("Failed to load profile.");
      } else {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [session]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">User Profile</h1>
      <h2 className="text-lg mt-2">Welcome, {session?.user?.email}</h2>

      {profile ? (
        <div className="mt-4 space-y-2">
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Display Name:</strong> {profile.display_name}</p>
          <p><strong>Bio:</strong> {profile.bio}</p>
        </div>
      ) : (
        <p className="mt-4">Loading profile...</p>
      )}

      <button
        onClick={handleSignOut}
        className="border px-4 py-2 mt-6 hover:bg-gray-100"
      >
        Sign Out
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default UserProfile;
