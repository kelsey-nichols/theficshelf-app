import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Bookshelf = () => {
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
      <h1>Bookshelf</h1>
      <h2>Welcome, {session?.user?.email}</h2>
      
    </div>
  );
};

export default Bookshelf;

