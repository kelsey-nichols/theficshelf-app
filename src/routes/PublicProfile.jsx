import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { ChevronDown } from "lucide-react"; 
import BackButton from "./BackButton";
import TabBar from "./TabBar";
import PostCard from "./PostCard";
import { formatDistanceToNow } from "date-fns";


const PublicProfile = () => {
  const { session } = UserAuth();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  const sessionUserId = session?.user?.id;

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, display_name, bio")
          .eq("username", username)
          .single();

        if (profileError || !profileData) throw profileError;
        setProfile(profileData);

        // Fetch follow status
        if (sessionUserId) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("followers_id", sessionUserId)
            .eq("following_id", profileData.id)
            .single();

          setIsFollowing(!!followData);
        }

        // Followers/following
        const [{ count: followingCount }, { count: followersCount }] =
          await Promise.all([
            supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("followers_id", profileData.id),
            supabase
              .from("follows")
              .select("*", { count: "exact", head: true })
              .eq("following_id", profileData.id),
          ]);

        setFollowingCount(followingCount || 0);
        setFollowersCount(followersCount || 0);

        // Words read
        const { data: shelf } = await supabase
          .from("shelves")
          .select("id")
          .eq("user_id", profileData.id)
          .eq("title", "Archive")
          .single();

        if (!shelf) return;

        const { data: shelfFics } = await supabase
          .from("shelf_fic")
          .select("fic_id")
          .eq("shelf_id", shelf.id);

        const ficIds = shelfFics.map((f) => f.fic_id);
        if (ficIds.length === 0) return;

        const { data: fics } = await supabase
          .from("fics")
          .select("words")
          .in("id", ficIds);

        const totalWords = fics.reduce((sum, fic) => sum + (fic.words || 0), 0);
        setWordsRead(totalWords);
      } catch (err) {
        setError("Failed to load profile.");
        console.error(err);
      }
    };

    fetchPublicProfile();
  }, [username, sessionUserId]);

  const handleFollowToggle = async () => {
    if (!sessionUserId || !profile?.id) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("followers_id", sessionUserId)
          .eq("following_id", profile.id);
      } else {
        await supabase.from("follows").insert({
          followers_id: sessionUserId,
          following_id: profile.id,
        });
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow/unfollow error:", err);
    }
  };

  const handleBlockUser = async () => {
    // Add your block logic here
    alert("Block feature not yet implemented.");
    setDropdownOpen(false);
  };

  const ProfilePosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserPosts = async () => {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", userId)
        .single();

      const ficIds = [...new Set(postsData.map(p => p.fic_id).filter(Boolean))];

      let ficsData = [];
      if (ficIds.length > 0) {
        const { data } = await supabase
          .from("fics")
          .select("id, title, author")
          .in("id", ficIds);
        ficsData = data || [];
      }

      const ficMap = ficsData.reduce((acc, fic) => {
        acc[fic.id] = fic;
        return acc;
      }, {});

      const enrichedPosts = postsData.map((post) => ({
        ...post,
        user: profileData,
        fic: ficMap[post.fic_id] || null,
      }));

      setPosts(enrichedPosts);
      setLoading(false);
    };

    fetchUserPosts();
  }, [userId]);

  if (loading) return <p>Loading posts...</p>;
  if (posts.length === 0) return <p>No posts yet.</p>;

    return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};


    const PublicShelves = ({ userId }) => {
  const [shelves, setShelves] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;

    const fetchPublicShelves = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("shelves")
        .select("id, title, color, sort_order")
        .eq("user_id", userId)
        .eq("is_private", false)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching public shelves:", error);
        setShelves([]);
      } else {
        setShelves(data || []);
      }
      setLoading(false);
    };

    fetchPublicShelves();
  }, [userId]);

  if (loading) {
    return <p>Loading public shelves...</p>;
  }

  if (shelves.length === 0) {
    return <p>No public shelves available.</p>;
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      {shelves.map((shelf) => (
        <Link
          key={shelf.id}
          to={`/bookshelf/${shelf.id}`}
          style={{ textDecoration: "none" }}
        >
          <button
            type="button"
            className="w-full p-4 rounded shadow-sm text-white font-semibold text-lg text-left mb-4"
            style={{ backgroundColor: shelf.color || "#333", cursor: "pointer" }}
          >
            {shelf.title}
          </button>
        </Link>
      ))}
    </div>
  );
};

  return (
  <>
    <div className="min-h-screen flex flex-col items-start justify-start bg-[#d3b7a4] text-[#202d26] p-6 font-serif">
      <div className="absolute top-12 left-1 text-[#202d26]">
        <BackButton />
      </div>

      {profile ? (
        <div className="w-full max-w-md mt-10 space-y-4 border-b border-[#202d26]/20 pb-6">
          {/* Header section stays centered */}
          <div className="text-center">
            <h1 className="text-3xl font-bold">{profile.display_name}</h1>
            <p className="text-[#956342]">@{profile.username}</p>
            <p className="mt-2">{profile.bio}</p>
            <div className="flex justify-center gap-6 mt-4 text-sm">
            <div>
              <span className="font-semibold">{followingCount}</span>{" "}
              <span className="text-[#956342]">Following</span>
            </div>
            <div>
              <span className="font-semibold">{followersCount}</span>{" "}
              <span className="text-[#956342]">Followers</span>
            </div>
          </div>

          <p className="mt-2 text-sm text-[#202d26]/80 text-center">
            {wordsRead.toLocaleString()} words read
          </p>

          {sessionUserId !== profile.id && (
            <div className="relative inline-block mt-4">
              <div className="flex border border-[#202d26]  overflow-hidden">
                {/* Follow/Unfollow button */}
                <button
                  onClick={handleFollowToggle}
                  className="px-4 py-2 hover:bg-[#202d26] hover:text-[#d3b7a4] transition-colors"
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>

                {/* Dropdown toggle */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-2 flex items-center justify-center hover:bg-[#202d26] hover:text-[#d3b7a4] transition-colors"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Dropdown content */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-24 bg-white border border-[#202d26] shadow z-10 text-left">
                  <button
                    onClick={handleBlockUser}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#f4ece6]"
                  >
                    Block
                  </button>
                </div>
              )}
            </div>
          )}
          </div>

          

          {/* Move tabs and content inside this container */}
          <TabBar
            tabs={[
              { id: "posts", label: "Posts" },
              { id: "shelves", label: "Bookshelf" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div
            style={{
              maxHeight: "60vh",
              overflowY: "auto",
              paddingTop: "1rem",
            }}
          >
            {activeTab === "posts" && profile && (
            <div className="text-left">
              <ProfilePosts userId={profile.id} />
            </div>
          )}
          {activeTab === "shelves" && profile && <PublicShelves userId={profile.id} />}
        </div>
      </div>
    ) : (
      <p className="mt-10">Loading profile...</p>
    )}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  </>
);

  
};

export default PublicProfile;
