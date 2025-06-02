import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export default function LayoutWithNavbar() {
  return (
    <div className="min-h-screen pb-16">
      {/* Top bar */}
      <div className="bg-[#202d26] py-3">
        <h1 className="text-right text-[#d3b7a4] italic text-2xl pr-4">
          the fic shelf
        </h1>
      </div>

      <Outlet />

      <Navbar />
    </div>
  );
}