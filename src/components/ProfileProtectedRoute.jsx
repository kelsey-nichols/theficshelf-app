import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

// eslint-disable-next-line react/prop-types
const ProfileProtectedRoute = ({ children }) => {
  const { user, session } = UserAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (session === undefined) return; // wait for session to be loaded

    if (!user) {
      setChecking(false);
      return;
    }

    const checkProfile = async () => {
      // TODO: Verify if "id" is the correct column name for user id in your profiles table.
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id) // Change "id" to "user_id" or your actual column if needed
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setHasProfile(false);
        setChecking(false);
        return;
      }

      setHasProfile(!!data);
      setChecking(false);
    };

    checkProfile();
  }, [user, session]);

  if (session === undefined || checking) {
    return <div className="p-4 text-center">Checking profile...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!hasProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  return children;
};

export default ProfileProtectedRoute;
