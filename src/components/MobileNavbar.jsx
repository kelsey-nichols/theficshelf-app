import { useState } from "react";
import { Menu, X, LibraryBig, Search, BookmarkPlus, Bookmark, Newspaper, User, LogOut, Bell, Info, Mail, Settings, Scroll, Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";

const primaryTabs = [
  { id: "bookshelf", icon: LibraryBig, label: "bookshelf", path: "/bookshelf" },
  { id: "discover", icon: Search, label: "discover", path: "/discover" },
  { id: "add-fic", icon: BookmarkPlus, label: "add fic", path: "/add-fic" },
  { id: "feed", icon: Newspaper, label: "feed", path: "/feed" },
  { id: "notifications", icon: Bell, label: "notifications", path: "/notifications" },
  { id: "user", icon: User, label: "user", path: "/user" },
  { id: "bookmarked-shelves", icon: Bookmark, label: "bookmarks", path: "/user/bookmarked-shelves" },
];

const secondaryTabs = [
  { id: "settings", icon: Settings, label:"settings", path: "/settings" },
  { id: "support", icon: Heart , label: "support us", path: "/support-us" },
  { id: "contact", icon: Mail, label:"contact us", path: "/contact"},
  { id: "terms", icon: Scroll , label: "terms", path: "/terms"},
];

export default function MobileNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = UserAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out failed:", err.message);
    }
  };

  const activeColor = "#886146";
  const inactiveColor = "#d3b7a4";
  const bgColor = "#202d26";

  return (
    <>
      {/* Top bar */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 z-50 bg-[#202d26] p-4 shadow-md justify-between items-center">
        <button onClick={toggleMenu}>
          {isOpen ? (
            <X className="text-[#d3b7a4] w-6 h-6" />
          ) : (
            <Menu className="text-[#d3b7a4] w-6 h-6" />
          )}
        </button>
        <span className="text-[#d3b7a4] font-serif font-bold italic text-2xl">the fic shelf</span>
      </div>

      {/* Slide-out menu */}
      {isOpen && (
        <div
          className="fixed top-16 left-0 right-0 bottom-0 z-40 bg-[#202d26] text-[#d3b7a4] p-4 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 4rem)" }}
        >
          <div className="flex flex-col gap-4">
            {primaryTabs.map(({ id, icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(path)}
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 text-left ${
                    isActive ? "bg-[#3b4c43]" : "hover:bg-[#2e3a34]"
                  }`}
                  style={{ color: isActive ? activeColor : inactiveColor }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-md font-medium">{label}</span>
                </button>
              );
            })}

            <hr className="border-[#d3b7a4] my-2" />

            {secondaryTabs.map(({ id, icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={id}
                  onClick={() => handleNav(path)}
                  className={`flex items-center px-4 py-3 rounded-xl transition-colors duration-200 text-left ${
                    isActive ? "bg-[#3b4c43]" : "hover:bg-[#2e3a34]"
                  }`}
                  style={{ color: isActive ? activeColor : inactiveColor }}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-md font-medium">{label}</span>
                </button>
              );
            })}

            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-3 rounded-xl transition-colors duration-200 text-left hover:bg-[#2e3a34]"
              style={{ color: inactiveColor }}
            >
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-md font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
