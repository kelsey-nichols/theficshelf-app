import { LibraryBig, Search, BookmarkPlus, Newspaper, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: 'bookshelf', icon: LibraryBig, label: 'Bookshelf', path: '/bookshelf' },
  { id: 'discover', icon: Search, label: 'Discover', path: '/discover' },
  { id: 'add-fic', icon: BookmarkPlus, label: 'AddFic', path: '/add-fic' },
  { id: 'feed', icon: Newspaper, label: 'Feed', path: '/feed' },
  { id: 'user', icon: User, label: 'User', path: '/user' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeColor = '#886146';  // Slightly lighter than the background
  const inactiveColor = '#d3b7a4';
  const bgColor = '#202d26';

  return (
    <nav className="fixed bottom-0 w-full shadow-md" style={{ backgroundColor: bgColor }}>
      <div className="flex justify-between px-2 py-3 pt-4">
        {tabs.map(({ id, icon: Icon, path }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={id}
              onClick={() => navigate(path)}
              className="flex flex-col items-center justify-center flex-1 focus:outline-none"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                appearance: 'none',
              }}
            >
              <Icon
                className="h-6 w-6 transition-colors"
                style={{ color: isActive ? activeColor : inactiveColor }}
              />
              <div
                className="mt-1 h-1 w-6 rounded-full transition-all duration-300"
                style={{ backgroundColor: isActive ? activeColor : 'transparent' }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
