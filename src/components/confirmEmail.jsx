import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Update if needed

export default function ConfirmEmail() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resendVerification = async () => {
    setLoading(true);
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase(),
    });

    if (resendError) {
      setError("Failed to resend email. Make sure it's a valid signup email.");
    } else {
      setMessage("Verification email resent! Check your inbox.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#202d26] text-[#956340] flex flex-col">
      {/* Logo */}
      <div
        className="absolute top-10 right-10 text-5xl italic font-bold font-serif"
        style={{ color: "#d3b7a4" }}
      >
        the fic shelf
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-grow px-4">
        <div className="bg-[#d3b7a4] p-8 rounded-lg w-full max-w-md shadow-lg text-center">
          <h1 className="text-[#202d26] text-xl font-bold mb-4 border-b-2 border-[#202d26] pb-2">
            confirm your email
          </h1>
          <p className="text-[#596760] mb-6">
          We sent you a confirmation email. Please check your inbox for an email from Supabase and confirm your email address and sign in to finish setting up your account.
          </p>

        <Link
            to="/signin"
            className="inline-block px-6 py-2 bg-[#202d26] text-[#d3b7a4] font-semibold rounded-full hover:opacity-90 transition mb-4"
          >
            SIGN IN
          </Link>

          {message && <p className="text-green-700 mb-2">{message}</p>}
          {error && <p className="text-red-700 mb-2">{error}</p>}

          <p className="text-[#596760] mb-4">
            Havent received an email? 
          </p>

          <input
  type="email"
  placeholder="Enter your email"
  className="w-full mb-4 p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78]"
  style={{
    backgroundColor: "#d3b7a4",
    borderColor: "#a98c78",
  }}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

          <button
            onClick={resendVerification}
            disabled={loading}
            className="inline-block px-6 py-2 bg-[#202d26] text-[#d3b7a4] font-semibold rounded-full hover:opacity-90 transition mb-4 disabled:opacity-50"
          >
            {loading ? "sending..." : "resend email"}
          </button>

          
        </div>
      </div>
    </div>
  );
}
