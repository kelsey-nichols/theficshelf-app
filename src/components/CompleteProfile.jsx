import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const CompleteProfile = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        navigate("/bookshelf");
      }
    };

    checkExistingProfile();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    setErrorMsg("");
    setUsernameError("");
  
    if (!username || !displayName) {
      setErrorMsg("Username and Display Name are required.");
      return;
    }
  
    setLoading(true);
  
    // Insert profile
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: user.id,
        username,
        display_name: displayName,
        bio,
      },
    ]);
  
    if (profileError) {
      setLoading(false);
      if (
        profileError.code === "23505" &&
        profileError.message.includes("profiles_username_key")
      ) {
        setUsernameError("Username is already taken.");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
      return;
    }
  
    // Insert default shelves
    const { error: shelfError } = await supabase.from("shelves").insert([
      {
        user_id: user.id,
        title: "Archive",
        is_private: true,
        color: "#8c8c8c", // optional color for Archive
        sort_order: 1,
      },
      {
        user_id: user.id,
        title: "Currently Reading",
        is_private: false,
        color: "#6ba4ff", // optional color
        sort_order: 2,
      },
      {
        user_id: user.id,
        title: "TBR",
        is_private: false,
        color: "#ffb347", // optional color
        sort_order: 3,
      },
    ]);
  
    setLoading(false);
  
    if (shelfError) {
      setErrorMsg("Profile saved, but failed to create shelves.");
      console.error("Shelf creation error:", shelfError);
      return;
    }
  
    navigate("/bookshelf");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      style={{ backgroundColor: "#d3b7a4" }}
    >
      <div
        className="absolute top-10 right-10 text-4xl italic font-bold font-serif"
        style={{ color: "#886146" }}
      >
        the fic shelf
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-8 rounded-xl shadow-md"
        style={{ backgroundColor: "#886146" }}
      >
        <h2
          className="text-3xl font-bold font-serif text-center pb-4"
          style={{ color: "#d3b7a4" }}
        >
          complete your profile
        </h2>

        {errorMsg && (
          <div
            className="text-red-600 text-sm border border-red-400 p-2 rounded mb-4"
            style={{ backgroundColor: "#fddede" }}
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-md">
            <input
              className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78] w-full"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                backgroundColor: "#d3b7a4",
                borderColor: "#a98c78",
              }}
            />
            {usernameError && (
              <p className="text-sm text-red-500 mt-1">{usernameError}</p>
            )}
          </div>

          <input
            className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78] w-full"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
            }}
          />

          <textarea
            className="p-3 rounded-2xl border text-[#886146] placeholder-[#a98c78] w-full resize-none"
            placeholder="Short Bio (optional)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            style={{
              backgroundColor: "#d3b7a4",
              borderColor: "#a98c78",
            }}
          />
        </div>

        <button
          type="submit"
          className="block mx-auto bg-[#202d26] text-[#d3b7a4] py-3 mt-6 text-xl mb-4 rounded-full font-semibold border border-[#886146] hover:bg-[#886146] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "saving..." : "SAVE"}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;

