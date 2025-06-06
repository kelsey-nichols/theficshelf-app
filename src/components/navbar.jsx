import {
  LibraryBig,
  Search,
  BookmarkPlus,
  Bookmark,
  Newspaper,
  User,
  LogOut,
  Bell,
  Mail,
  Scroll,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import MobileNavbar from "./MobileNavbar";

const mainTabs = [
  { id: "bookshelf", icon: LibraryBig, label: "bookshelf", path: "/bookshelf" },
  { id: "discover", icon: Search, label: "discover", path: "/discover" },
  { id: "add-fic", icon: BookmarkPlus, label: "add fic", path: "/add-fic" },
  { id: "feed", icon: Newspaper, label: "feed", path: "/feed" },
  { id: "notifications", icon: Bell, label: "notifications", path: "/notifications" },
  { id: "user", icon: User, label: "user", path: "/user" },
  { id: "bookmarked-shelves", icon: Bookmark, label: "bookmarks", path: "/user/bookmarked-shelves" },
];

const secondaryTabs = [
  
  { id: "contact", icon: Mail, label:"contact us", path: "/contact"},
  { id: "terms", icon: Scroll, label: "terms", path: "/terms"},
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = UserAuth();

  const activeColor = "#886146";
  const inactiveColor = "#d3b7a4";
  const bgColor = "#202d26";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out failed:", err.message);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className="hidden md:flex fixed top-0 left-0 h-screen w-64 p-4 flex-col shadow-lg z-50"
        style={{ backgroundColor: bgColor }}
      >
        {/* ─── App Title ─────────────────────────────── */}
        <div className="mb-6 px-4">
          <h1 className="text-2xl font-bold italic text-[#d3b7a4] font-serif tracking-wide">
            the fic shelf
          </h1>
        </div>

        {/* ─── Main Tabs ─────────────────────────────── */}
        {mainTabs.map(({ id, icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex items-center px-4 py-3 rounded-xl mb-2 transition-colors duration-200 text-left ${
                isActive ? "bg-[#3b4c43]" : "hover:bg-[#2e3a34]"
              }`}
              style={{ color: isActive ? activeColor : inactiveColor }}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="text-md font-medium">{label}</span>
            </button>
          );
        })}

        {/* ─── Divider ─────────────────────────────── */}
        <hr className="my-4 border-[#886146]" />

        {/* ─── Secondary Tabs ───────────────────────── */}
        {secondaryTabs.map(({ id, icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={`flex items-center px-4 py-3 rounded-xl mb-2 transition-colors duration-200 text-left ${
                isActive ? "bg-[#3b4c43]" : "hover:bg-[#2e3a34]"
              }`}
              style={{ color: isActive ? activeColor : inactiveColor }}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="text-md font-medium">{label}</span>
            </button>
          );
        })}

        {/* ─── Spacer ─────────────────────────────── */}
        <div className="flex-grow" />

        {/* ─── Sign Out ────────────────────────────── */}
        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-3 rounded-xl mt-auto transition-colors duration-200 text-left hover:bg-[#2e3a34]"
          style={{ color: inactiveColor }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-md font-medium">Sign Out</span>
        </button>
      </nav>

      {/* Mobile Navbar */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </>
  );
}
