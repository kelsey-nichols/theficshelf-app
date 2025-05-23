import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const LogFic = () => {
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
      <h1>Log Fic</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      
    </div>
  );
};

export default LogFic;