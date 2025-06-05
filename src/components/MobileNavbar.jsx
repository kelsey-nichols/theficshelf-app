import { Menu } from "lucide-react";

export default function MobileNavbar({ onToggle }) {
  return (
    <div className="flex md:hidden fixed top-0 left-0 right-0 z-50 bg-[#202d26] p-4 shadow-md justify-between items-center">
      <button onClick={onToggle}>
        <Menu className="text-[#d3b7a4] w-6 h-6" />
      </button>
      <span className="text-[#d3b7a4] font-serif font-bold italic text-2xl">the fic shelf</span>
    </div>
  );
}