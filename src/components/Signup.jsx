import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      email &&
      password &&
      confirmPassword &&
      password === confirmPassword &&
      agreedToTerms
    ) {
      setCanSubmit(true);
      setError(null);
    } else {
      setCanSubmit(false);
      if (password !== confirmPassword && confirmPassword.length > 0) {
        setError("Passwords do not match.");
      } else if (!agreedToTerms) {
        setError("You must agree to the Terms of Service to create an account.");
      } else {
        setError(null);
      }
    }
  }, [email, password, confirmPassword, agreedToTerms]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
  
    try {
      const result = await signUpNewUser(email, password);
  
      if (result.success) {
        const user = result.data.user;
  
        if (!user) {
          // User already exists but hasn't confirmed their email
          setError("This email is already registered but not yet confirmed. Please check your inbox or try signing in.");
        } else {
          navigate("/confirm-email");
        }
      } else {
        // User exists and has confirmed email
        if (result.error.message.toLowerCase().includes("user already registered")) {
          setError("This email is already registered. Please sign in instead.");
        } else {
          setError(result.error.message);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{ backgroundColor: "#d3b7a4" }}
    >
      {/* Top right corner text */}
      <div
        className="absolute top-10 right-10 text-4xl italic font-bold font-serif"
        style={{ color: "#886146" }}
      >
        the fic shelf
      </div>

      <form
        onSubmit={handleSignUp}
        className="w-full max-w-md p-8 rounded-xl shadow-md"
        style={{ backgroundColor: "#886146" }}
      >
        <h2
          className="text-4xl font-bold font-serif text-center pb-4"
          style={{ color: "#d3b7a4" }}
        >
          create account
        </h2>

        <div className="flex flex-col mb-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78]"
            type="email"
            placeholder="Email"
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
            }}
            value={email}
          />
        </div>

        <div className="flex flex-col mb-4">
          <input
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78]"
            type="password"
            placeholder="Password"
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
            }}
            value={password}
          />
        </div>

        <div className="flex flex-col mb-6">
          <input
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78]"
            type="password"
            placeholder="Confirm Password"
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
            }}
            value={confirmPassword}
          />
        </div>

        <div className="flex justify-center items-center mb-6">
  <input
    type="checkbox"
    id="terms"
    checked={agreedToTerms}
    onChange={() => setAgreedToTerms(!agreedToTerms)}
    className="appearance-none h-5 w-5 border-2 border-[#202d26] rounded-sm mr-3 checked:bg-[#202d26] checked:border-[#202d26] focus:outline-none cursor-pointer transition"
  />
  <label htmlFor="terms" className="text-sm text-[#d3b7a4]">
    I agree to the{" "}
    <Link
      to="/terms"
      className="underline hover:text-purple-900 visited:text-[#202d26]"
    >
      Terms of Service
    </Link>
  </label>
</div>

        <button
          className="block mx-auto bg-[#202d26] text-[#d3b7a4] py-3 text-xl mb-4 rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ width: "60%" }}
          type="submit"
          disabled={!canSubmit || loading}
        >
          SIGN UP
        </button>

        <p
  className="text-center italic text-sm whitespace-nowrap"
  style={{ color: "#d3b7a4" }}
>
  Already have an account?{" "}
  <Link
    to="/signin"
    className="underline hover:text-purple-900"
    style={{ color: "#d3b7a4" }}
  >
    Sign in
  </Link>
</p>

        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </form>
    </div>
  );
};

export default Signup;
