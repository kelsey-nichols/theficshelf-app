import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const Signin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signInUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { session, error } = await signInUser(email, password);

    if (error) {
      setError(error.message || "Failed to sign in.");
      setTimeout(() => setError(""), 3000);
    } else {
      navigate("/bookshelf");
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
        onSubmit={handleSignIn}
        className="w-full max-w-md p-8 rounded-xl shadow-md"
        style={{ backgroundColor: "#886146" }}
      >
        <h2
          className="text-4xl font-bold font-serif text-center pb-4"
          style={{ color: "#d3b7a4" }}
        >
          welcome back
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
          />
        </div>

        <button
          className="block mx-auto bg-[#202d26] text-[#d3b7a4] py-3 text-xl mb-4 rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition"
          style={{ width: "60%" }}
          type="submit"
        >
          SIGN IN
        </button>

        <p className="text-center pb-1 italic text-sm" style={{ color: "#d3b7a4" }}>
  <Link to="/forgot-password" className="underline hover:text-purple-900" style={{ color: "#d3b7a4" }}>
    Forgot password?
  </Link>
</p>

        <p className="text-center italic text-sm" style={{ color: "#d3b7a4" }}>
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="underline hover:text-purple-900"
            style={{ color: "#d3b7a4" }}
          >
            Sign up
          </Link>
        </p>

        {error && <p className="text-red-600 text-center pt-4">{error}</p>}
      </form>
    </div>
  );
};

export default Signin;
