import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Discover = () => {
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
      <h1>Discover</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      
    </div>
  );
};

export default Discover;