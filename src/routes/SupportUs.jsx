import React from "react";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

export default function SupportUsPage() {
  const navigate = useNavigate();
  const { user } = UserAuth();

  return (
    <div className="min-h-screen bg-[#d3b7a4] p-6 font-serif flex flex-col items-center">
      <h1 className="text-4xl font-bold text-[#202d26] mb-4">support us</h1>
      <div className="max-w-xl bg-[#202d26] text-[#d3b7a4] rounded-xl p-8 shadow-md space-y-6">
        <p className="text-lg">
          Thank you for considering supporting <strong>The Fic Shelf</strong>! Your contribution helps keep our platform running, improve features, and reward our hard-working team.
        </p>

        <div className="flex items-center justify-center space-x-2">
          <Heart className="w-6 h-6 text-[#886146] animate-pulse" />
          <span className="text-[#886146] font-semibold">Coming Soon</span>
        </div>

        <p className="text-sm">
          We’re setting up our donation system via Stripe. Once our domain is live, you’ll be able to make secure donations here.
        </p>
      </div>
    </div>
  );
}