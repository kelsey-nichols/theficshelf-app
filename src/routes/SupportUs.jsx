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
      <div className="max-w-xl w-full bg-[#202d26] text-[#d3b7a4] rounded-xl p-8 shadow-md space-y-6">
        <p className="text-lg">
          Thank you for considering supporting <strong>the fic shelf</strong>!  
          Your contribution helps keep the platform running.
        </p>

        {/* → Replace “Coming Soon” with your Stripe Pricing Table */}
        <div className="flex justify-center">
          <stripe-pricing-table
            pricing-table-id="prctbl_1RXakxDeRxyo3OqiNv9ZYHLg"
            publishable-key="pk_live_51RX7DnDeRxyo3Oqi85lWzX2P2NziV6XJlIO2zvjWaqitkcsA8Asm0CHoVCkvTjZHSSJJCGsKZwjKAeyf4G9iHxeT00zfEM2pxN"
          />
        </div>

        <p className="text-sm text-[#826555]">
          All payments are processed securely by Stripe. Select a tier above to subscribe.
        </p>
      </div>
    </div>
  );
}