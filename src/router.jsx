import { createBrowserRouter, Outlet } from "react-router-dom";
import App from "./App";
import Welcome from "./components/welcome";
import Signup from "./components/Signup";
import Signin from "./components/Signin";
import Bookshelf from "./routes/Bookshelf";
import PrivateRoute from "./components/PrivateRoute";
import ConfirmEmail from "./components/confirmEmail";
import ForgotPassword from "./components/forgotPassword";
import Tos from "./components/Tos";
import ProtectedLayout from "./components/ProtectedLayout";
// Removed UserLayout import
import UserProfile from "./routes/User";
import Discover from "./routes/Discover";
import LogFic from "./routes/LogFic";
import Feed from "./routes/Feed";
import CompleteProfile from "./components/CompleteProfile";
import ProfileProtectedRoute from "./components/ProfileProtectedRoute";
import ShelfPage from "./routes/ShelfPage";
import CreateShelf from "./routes/CreateShelf";
import BookmarkedShelves from "./routes/BookmarkedShelves";
import FicPage from "./routes/FicPage";
import AddFic from "./routes/AddFic";
import ShareFicPage from "./routes/ShareFic";
import ShareShelfPage from "./routes/ShareShelf";
import EditFic from "./routes/EditFic";
import PublicProfile from "./routes/PublicProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public routes
      { index: true, element: <Welcome /> },
      { path: "signup", element: <Signup /> },
      { path: "signin", element: <Signin /> },
      { path: "confirm-email", element: <ConfirmEmail /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "terms", element: <Tos /> },

      // Logged in users who may not have completed profile yet
      {
        element: (
          <PrivateRoute>
            <Outlet />
          </PrivateRoute>
        ),
        children: [{ path: "complete-profile", element: <CompleteProfile /> }],
      },

      // Logged in users who have completed profile
      {
        element: (
          <PrivateRoute>
            <ProfileProtectedRoute>
              <ProtectedLayout />
            </ProfileProtectedRoute>
          </PrivateRoute>
        ),
        children: [
          { path: "bookshelf", element: <Bookshelf /> },
          { path: "discover", element: <Discover /> },
          { path: "log-fic/:ficId", element: <LogFic /> },
          { path: "add-fic", element: <AddFic /> },
          { path: "feed", element: <Feed /> },
          { path: "bookshelf/:shelfId", element: <ShelfPage /> },
          { path: "create-shelf", element: <CreateShelf /> },
          { path: "fic/:ficId", element: <FicPage /> },
          { path: "share-fic", element: <ShareFicPage /> },
          { path: "share-shelf", element: <ShareShelfPage /> },
          { path: "edit-fic/:ficId", element: <EditFic /> },
          { path: "user/:username", element: <PublicProfile /> },

          // Flattened user routes without UserLayout wrapper
          { path: "user", element: <UserProfile /> },
          { path: "user/bookmarked-shelves", element: <BookmarkedShelves /> },
        ],
      },
    ],
  },
]);


