import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const UserProfile = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      await signOut();
      navigate("/"); // 
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div>
      <h1>User profile</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      <div>
        <p
          onClick={handleSignOut}
          className="hover:cursor-pointer border inline-block px-4 py-3 mt-4"
        >
          Sign out
        </p>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default UserProfile;