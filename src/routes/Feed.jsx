// src/components/Feed.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Plus, X } from "lucide-react";
import PostCard from "./PostCard"; // Make sure this path is correct

export default function Feed() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [shareFicId, setShareFicId] = useState(null);
  const [shareShelfId, setShareShelfId] = useState(null);

  const userId = session?.user?.id;

  // ─── 1) Fetch feed posts (your own + people you follow) ─────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      if (!userId) return;

      // 1.a) Who you follow
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("followers_id", userId);

      const followingIds = follows?.map((f) => f.following_id) || [];
      followingIds.push(userId);

      // 1.b) Fetch posts by yourself & everyone you follow
      const { data: rawPosts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false });

      if (postsError) {
        setError("Failed to load posts.");
        return;
      }

      // 1.c) Pull author profiles, fic info, shelf info
      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
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

      const enrichedPosts = rawPosts.map((post) => {
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

  // ─── 2) Create a post ───────────────────────────────────────────────────────────
  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;

    const { error: createError } = await supabase.from("posts").insert([
      {
        user_id: userId,
        text: newPostText,
        fic_id: shareFicId,
        shelf_id: shareShelfId,
      },
    ]);
    if (createError) {
      setError("Failed to post.");
      return;
    }

    setNewPostText("");
    setComposerOpen(false);
    navigate("/feed");
    // Force a refresh to re-fetch feed
    window.location.reload();
  };

  // ─── 3) Grab query params for sharing fic/shelf ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShareFicId(params.get("fic_id"));
    setShareShelfId(params.get("shelf_id"));
  }, [location.search]);

  return (
    <div className="min-h-screen bg-[#d3b7a4] font-serif">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {/* ================= HEADER (TITLE) ================= */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202d26]">feed</h1>
        </div>

        {/* ================= COMPOSER SECTION ================= */}
        <div className="mb-6 rounded-lg p-4 shadow-sm bg-[#886146]">
          <div
            className="flex justify-between items-center cursor-pointer text-[#d3b7a4]"
            onClick={() => setComposerOpen((prev) => !prev)}
          >
            <span className="font-bold select-none">
              {composerOpen ? "write something..." : "start a post"}
            </span>
            {composerOpen ? (
              <X size={20} color="#d3b7a4" />
            ) : (
              <Plus size={20} color="#d3b7a4" />
            )}
          </div>

          {composerOpen && (
            <div className="mt-4">
              {(shareFicId || shareShelfId) && (
                <div className="mb-2 space-y-1">
                  {shareFicId && (
                    <div className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-lg inline-block">
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
                className="w-full p-3 rounded-lg mb-3 bg-[#d3b7a4] text-[#202d26] placeholder-[#a98c78] border border-[#a98c78] focus:outline-none focus:ring-2 focus:ring-[#202d26] resize-none"
                rows="4"
                placeholder="What's on your mind?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
              />
              <div className="flex justify-center">
                <button
                  onClick={handleCreatePost}
                  className="bg-[#202d26] text-[#d3b7a4] px-6 py-2 rounded-lg hover:opacity-90 w-full max-w-xs sm:max-w-sm"
                >
                  POST
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= POSTS ================= */}
        {posts.map((post) => (
          <div key={post.id} className="mb-6">
            <PostCard post={post} />
          </div>
        ))}

        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
}
