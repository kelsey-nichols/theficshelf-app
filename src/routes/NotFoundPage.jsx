import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#d3b7a4] flex flex-col items-center justify-center p-6 font-serif">
      <h1 className="text-5xl font-bold text-[#202d26] mb-4">404</h1>
      <p className="text-xl text-[#202d26] mb-6">Oops! Page not found.</p>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center px-4 py-2 bg-[#202d26] text-[#d3b7a4] rounded-full hover:bg-[#36433c] transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Go Back
      </button>
    </div>
  );
}