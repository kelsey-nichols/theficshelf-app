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
import LayoutWithNavbar from "./components/LayoutNavbar";
import UserProfile from "./routes/User";
import Discover from "./routes/Discover";
import LogFic from "./routes/LogFic";
import Feed from "./routes/Feed";
import CompleteProfile from "./components/CompleteProfile";
import ProfileProtectedRoute from "./components/ProfileProtectedRoute";

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

      // Routes for logged in users who may not have completed profile yet
      {
        element: <PrivateRoute><Outlet /></PrivateRoute>,
        children: [
          { path: "complete-profile", element: <CompleteProfile /> },
        ],
      },

      // Routes for logged in users who have completed profile
      {
        element: (
          <PrivateRoute>
            <ProfileProtectedRoute>
              <LayoutWithNavbar />
            </ProfileProtectedRoute>
          </PrivateRoute>
        ),
        children: [
          { path: "bookshelf", element: <Bookshelf /> },
          { path: "user", element: <UserProfile /> },
          { path: "discover", element: <Discover /> },
          { path: "log-fic", element: <LogFic /> },
          { path: "feed", element: <Feed /> },
        ],
      },
    ],
  },
]);
