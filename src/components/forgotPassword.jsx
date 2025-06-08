import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        setError(error.message);
      } else {
        setMessage(
          "If the email is registered, you will receive a password reset link shortly."
        );
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        onSubmit={handleResetPassword}
        className="bg-[#886146] p-8 rounded-lg max-w-md w-full shadow-lg text-center"
      >
        <h1
          className="text-[#d3b7a4] text-2xl font-bold mb-4 "
        >
          forgot password?
        </h1>

        <p className="text-[#d3b7a4] mb-6">
          No worries! Just enter your email and follow the temporary access link sent to you to update your password.
        </p>

        <div className="flex flex-col mb-4">
  <input
    onChange={(e) => setEmail(e.target.value)}
    className="p-3 rounded-full border text-[#886146] placeholder-[#886146]"
    type="email"
    placeholder="Email"
    style={{
      backgroundColor: "#d3b7a4",
      borderColor: "#a98c78",
      color: "#886146",
      borderWidth: "3px",
    }}
    value={email}
  />
</div>

    


        <button
          type="submit"
          disabled={loading}
          className="w-3/5 mx-auto bg-[#202d26] text-[#d3b7a4] py-3 rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition disabled:opacity-50 mb-4"
        >
          {loading ? "Sending..." : "Send Access Link"}
        </button>

        <div className="text-center mb-3">
        <Link
        to="/"
        className="underline text-sm text-[#d3b7a4] hover:text-purple-900 visited:text-[#202d26]"
    >
        return to home
    </Link>
    </div>

        {message && (
          <p className="text-green-600 mt-2">{message}</p>
        )}

        {error && (
          <p className="text-red-600 mt-2">{error}</p>
        )}
      </form>
      
    </div>

    

  );
}
