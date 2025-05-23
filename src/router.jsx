import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Welcome from "./components/welcome"; // import Welcome here
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
import { User } from "lucide-react";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "signup", element: <Signup /> },
      { path: "signin", element: <Signin /> },
      { path: "confirm-email", element: <ConfirmEmail /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "terms", element: <Tos /> },

      // Authenticated layout with navbar
      {
        element: (
          <PrivateRoute>
            <LayoutWithNavbar />
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
