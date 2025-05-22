import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

export default function Welcome() {
  const { user } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div
      className="flex flex-col min-h-screen relative px-10"
      style={{ backgroundColor: "#202d26" }}
    >
      {/* Top right corner */}
      <div
        className="absolute top-10 right-10 text-5xl italic font-bold font-serif"
        style={{ color: "#d3b7a4" }}
      >
        the fic shelf
      </div>

      {/* Middle: Left-aligned 'hello, reader' vertically centered */}
      <div className="flex flex-1 items-center pt-24">
        <h1 className="text-7xl font-serif" style={{ color: "#d3b7a4" }}>
          hello, reader
        </h1>
      </div>

      {/* Bottom: Buttons centered horizontally with bottom padding */}
      <div className="flex justify-center pb-10 mb-16">
        <div className="flex flex-col items-center w-full max-w-xs space-y-4">
        <button
  onClick={() => navigate("/signup")}
  className="border-3 px-8 py-3 text-xl rounded-full w-full transition"
  style={{
    color: '#d3b7a4',
    borderColor: '#d3b7a4',
    backgroundColor: 'transparent',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.backgroundColor = '#d3b7a4';
    e.currentTarget.style.color = '#202d26';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#d3b7a4';
  }}
>
  SIGN UP
</button>
<button
  onClick={() => navigate("/signin")}
  className="border-3 px-8 py-3 text-xl rounded-full w-full transition"
  style={{
    color: '#aebbb4',
    borderColor: '#aebbb4',
    backgroundColor: 'transparent',
  }}
  onMouseEnter={e => {
    e.currentTarget.style.backgroundColor = '#aebbb4';
    e.currentTarget.style.color = '#202d26';
  }}
  onMouseLeave={e => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#aebbb4';
  }}
>
  SIGN IN
</button>
        </div>
      </div>
    </div>
  );
}
