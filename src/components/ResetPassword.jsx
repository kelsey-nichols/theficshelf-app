// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [newPwd, setNewPwd] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Grab the tokens from the URL and store the session
    supabase.auth
      .getSessionFromUrl({ storeSession: true })
      .then(({ error }) => {
        if (error) setError("Invalid or expired link.");
        setLoading(false);
      });
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!newPwd) return setError("Please enter a new password.");
    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPwd,
    });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Password updated! Redirecting…");
      setTimeout(() => navigate("/bookshelf"), 2000);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#d3b7a4] flex items-center justify-center">
        <p className="text-[#886146]">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#d3b7a4] flex flex-col items-center justify-center px-4"
      style={{ color: "#956340" }}
    >
      <div
        className="absolute top-10 right-10 text-5xl italic font-bold font-serif"
        style={{ color: "#886146" }}
      >
        the fic shelf
      </div>

      <form
        onSubmit={handleSetPassword}
        className="bg-[#886146] p-8 rounded-lg max-w-md w-full shadow-lg text-center"
      >
        <h1 className="text-[#d3b7a4] text-2xl font-bold mb-4">
          reset password
        </h1>

        <p className="text-[#d3b7a4] mb-6">
          Please choose a new password for your account.
        </p>

        <div className="flex flex-col mb-4">
          <input
            type="password"
            placeholder="New password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="p-3 rounded-full border text-[#886146] placeholder-[#886146]"
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
              color: "#886146",
              borderWidth: "3px",
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-3/5 mx-auto bg-[#202d26] text-[#d3b7a4] py-3 rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition disabled:opacity-50 mb-4"
        >
          {loading ? "Saving…" : "Save Password"}
        </button>

        <div className="text-center mb-3">
          <Link
            to="/"
            className="underline text-sm text-[#d3b7a4] hover:text-purple-900 visited:text-[#202d26]"
          >
            return to home
          </Link>
        </div>

        {message && <p className="text-green-400 mt-2">{message}</p>}
        {error && <p className="text-red-400 mt-2">{error}</p>}
      </form>
    </div>
  );
}
