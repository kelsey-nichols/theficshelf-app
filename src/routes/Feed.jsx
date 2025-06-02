import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Plus, X } from "lucide-react";
import PostCard from "./PostCard"; // Make sure this path is correct

const Feed = () => {
  const { session, signOut } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");

  const [shareFicId, setShareFicId] = useState(null);
  const [shareShelfId, setShareShelfId] = useState(null);

  const userId = session?.user?.id;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShareFicId(params.get("fic_id"));
    setShareShelfId(params.get("shelf_id"));
  }, [location.search]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) return;

      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("followers_id", userId);

      const followingIds = follows?.map((f) => f.following_id) || [];
      followingIds.push(userId);

      const { data: posts, error } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Failed to load posts.");
        return;
      }

      const userIds = [...new Set(posts.map((post) => post.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds);

      const { data: fics } = await supabase
        .from("fics")
        .select("id, title, author, link");

      const { data: shelves } = await supabase
        .from("shelves")
        .select("id, title, user_id");

      const enrichedPosts = posts.map((post) => {
        const user = profiles.find((p) => p.id === post.user_id);
        const fic = fics?.find((f) => f.id === post.fic_id);
        const shelf = shelves?.find((s) => s.id === post.shelf_id);

        return {
          ...post,
          user,
          fic,
          shelf,
        };
      });

      setPosts(enrichedPosts);
    };

    fetchPosts();
  }, [userId]);

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;

    const { error } = await supabase.from("posts").insert([
      {
        user_id: userId,
        text: newPostText,
        fic_id: shareFicId,
        shelf_id: shareShelfId,
      },
    ]);

    if (error) {
      setError("Failed to post.");
      return;
    }

    setNewPostText("");
    setComposerOpen(false);
    navigate("/feed");
    window.location.reload();
  };

return (
    <div className="max-w-xl mx-auto px-4 py-6 bg-[#d3b7a4] font-serif">
      {/* Composer */}
      <div className="mb-6 rounded-lg p-4 shadow-sm bg-[#886146]">
        <div
          className="flex justify-between items-center cursor-pointer text-[#d3b7a4] "
          onClick={() => setComposerOpen(!composerOpen)}
        >
          <span className="font-bold">
            {composerOpen ? "write something..." : "start a post"}
          </span>
          {composerOpen ? <X size={20} color="#d3b7a4" /> : <Plus size={20} color="#d3b7a4" />}
        </div>

        {composerOpen && (
          <div className="mt-4">
            {(shareFicId || shareShelfId) && (
              <div className="mb-2">
                {shareFicId && (
                  <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-lg inline-block mb-1">
                    Sharing Fic: {shareFicId}
                  </div>
                )}
                {shareShelfId && (
                  <div className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-lg inline-block">
                    Sharing Shelf: {shareShelfId}
                  </div>
                )}
              </div>
            )}
            <textarea
              className="w-full p-2 rounded-lg mb-2 bg-[#d3b7a4] text-[#202d26] placeholder-[#a98c78] border border-[#a98c78] focus:outline-none focus:ring-2 focus:ring-[#202d26]"
              rows="3"
              placeholder="What's on your mind?"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <div className="flex justify-center">
              <button
                onClick={handleCreatePost}
                className="bg-[#202d26] text-[#d3b7a4] px-4 py-2 rounded-lg hover:opacity-90"
              >
                POST
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div key={post.id} className="mb-6">
          <PostCard post={post} />
        </div>
      ))}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Feed;
