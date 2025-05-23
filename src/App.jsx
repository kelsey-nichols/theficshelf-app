import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { UserAuth } from "./context/AuthContext";


function App() {
  const { user } = UserAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/bookshelf");
    }
  }, [user, navigate]);

  // Render the nested routes here with <Outlet />
  return <Outlet />;
}

export default App;
