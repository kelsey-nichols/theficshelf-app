import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import BackButton from "./BackButton";
import TabBar from "./TabBar";
import PostCard from "./PostCard";

const PublicProfile = () => {
  const { session } = UserAuth();
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [wordsRead, setWordsRead] = useState(0);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");

  const sessionUserId = session?.user?.id;

  // Fetch public profile & follow data
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

        // Fetch follow status if logged in
        if (sessionUserId) {
          const { data: followData, error: followError } = await supabase
            .from("follows")
            .select("*")
            .eq("followers_id", sessionUserId)
            .eq("following_id", profileData.id)
            .maybeSingle();

          if (followError) {
            console.error("Follow status error:", followError);
            setIsFollowing(false); // fallback
          } else {
            setIsFollowing(!!followData);
          }
        }

        // Fetch followers/following counts exactly like UserProfile
        const [
          { count: followingCnt },
          { count: followersCnt },
        ] = await Promise.all([
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("followers_id", profileData.id),
          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", profileData.id),
        ]);

        setFollowingCount(followingCnt || 0);
        setFollowersCount(followersCnt || 0);

        // Fetch words read (Archive shelf logic)
        const { data: shelfData } = await supabase
          .from("shelves")
          .select("id")
          .eq("user_id", profileData.id)
          .eq("title", "Archive")
          .single();

        if (shelfData) {
          const { data: shelfFics } = await supabase
            .from("shelf_fic")
            .select("fic_id")
            .eq("shelf_id", shelfData.id);

          const ficIds = shelfFics.map((f) => f.fic_id);
          if (ficIds.length > 0) {
            const { data: ficsData } = await supabase
              .from("fics")
              .select("words")
              .in("id", ficIds);
            const totalWords = ficsData.reduce(
              (sum, fic) => sum + (fic.words || 0),
              0
            );
            setWordsRead(totalWords);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile.");
      }
    };

    fetchPublicProfile();
  }, [username, sessionUserId]);

  // Follow/unfollow handler
  const handleFollowToggle = async () => {
    if (!sessionUserId || !profile?.id) return;

    try {
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("followers_id", sessionUserId)
          .eq("following_id", profile.id);
        setIsFollowing(false);
        setFollowersCount((cnt) => cnt - 1);
      } else {
        await supabase.from("follows").insert({
          followers_id: sessionUserId,
          following_id: profile.id,
        });
        setIsFollowing(true);
        setFollowersCount((cnt) => cnt + 1);
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
    }
  };

  // ---------------------------------------------------
  // ProfilePosts inner component
  // eslint-disable-next-line react/prop-types
  const ProfilePosts = ({ userId }) => {
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    useEffect(() => {
      if (!userId) return;
      const fetchUserPosts = async () => {
        setLoadingPosts(true);
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setPosts([]);
          setLoadingPosts(false);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .eq("id", userId)
          .single();

        const ficIds = [
          ...new Set(postsData.map((p) => p.fic_id).filter(Boolean)),
        ];

        let ficMap = {};
        if (ficIds.length > 0) {
          const { data: ficsData } = await supabase
            .from("fics")
            .select("id, title, author")
            .in("id", ficIds);
          ficMap = ficsData.reduce((acc, fic) => {
            acc[fic.id] = fic;
            return acc;
          }, {});
        }

        const enrichedPosts = postsData.map((post) => ({
          ...post,
          user: profileData,
          fic: ficMap[post.fic_id] || null,
        }));

        setPosts(enrichedPosts);
        setLoadingPosts(false);
      };

      fetchUserPosts();
    }, [userId]);

    if (loadingPosts) return <p>Loading posts...</p>;
    if (posts.length === 0) return <p className="text-center">No posts yet.</p>;

    return (
      <div className="space-y-4 px-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  // ---------------------------------------------------
  // PublicShelves inner component
  // eslint-disable-next-line react/prop-types
  const PublicShelves = ({ userId }) => {
    const [shelves, setShelves] = useState([]);
    const [loadingShelves, setLoadingShelves] = useState(true);

    useEffect(() => {
      if (!userId) return;
      const fetchPublicShelves = async () => {
        setLoadingShelves(true);
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
        setLoadingShelves(false);
      };
      fetchPublicShelves();
    }, [userId]);

    if (loadingShelves) return <p>Loading public shelves...</p>;
    if (shelves.length === 0)
      return <p className="text-center">No public shelves available.</p>;

    return (
      <div className="space-y-4 px-4">
        {shelves.map((shelf) => (
          <Link
            key={shelf.id}
            to={`/bookshelf/${shelf.id}`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="w-full p-4 mb-4 rounded shadow-sm text-[#d3b7a4] font-semibold text-lg"
              style={{
                backgroundColor: shelf.color || "#333",
                cursor: "pointer",
              }}
            >
              {shelf.title}
            </div>
          </Link>
        ))}
      </div>
    );
  };

  // ---------------------------------------------------
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d3b7a4]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#d3b7a4]">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d3b7a4] text-[#202d26] font-serif p-6 flex flex-col items-center">
      {/* Back Button (fixed) */}
      <div className="absolute top-6 left-6">
        <BackButton />
      </div>

      {/* Profile Header */}
      <div className="w-full max-w-md mt-10 space-y-4 border-b border-[#202d26]/20 pb-6 text-center">
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

        <p className="mt-2 text-sm text-[#202d26]/80">
          {wordsRead.toLocaleString()} words read
        </p>

        {sessionUserId !== profile.id && (
          <div className="relative inline-block mt-4">
            <div className="flex border border-[#202d26] overflow-hidden">
              {/* Follow/Unfollow button */}
              <button
                onClick={handleFollowToggle}
                className="px-4 py-2 hover:bg-[#202d26] hover:text-[#d3b7a4] transition-colors"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="w-full max-w-md mt-6">
        <TabBar
          tabs={[
            { id: "posts", label: "Posts" },
            { id: "shelves", label: "Bookshelf" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div
        className="w-full max-w-md mt-4 flex-grow overflow-y-auto"
        style={{ maxHeight: "60vh" }}
      >
        {activeTab === "posts" && <ProfilePosts userId={profile.id} />}
        {activeTab === "shelves" && <PublicShelves userId={profile.id} />}
      </div>
    </div>
  );
};

export default PublicProfile;
