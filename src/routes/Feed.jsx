import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Plus, X } from "lucide-react";

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
      followingIds.push(userId); // Include user's own posts

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
    navigate("/feed"); // Clear URL params
    window.location.reload(); // Reload posts
  };

  const renderPostHeader = (post) => {
    const name = post.user?.display_name || "Unknown";
    const handle = post.user?.username || "user";
    const time = formatDistanceToNow(new Date(post.created_at), {
      addSuffix: true,
    });

    return (
      <div className="text-sm text-gray-500">
        <span className="font-semibold text-black">{name}</span>{" "}
        <span className="text-gray-400">@{handle}</span> · {time}
      </div>
    );
  };

  const renderAttachedItem = (post) => {
  if (post.fic && !post.text.includes("[fic]")) {
    return (
      <a
        href={`/fic/${post.fic.id}`}
        className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-lg mt-2"
      >
        📖 {post.fic.title} by {post.fic.author}
      </a>
    );
  }

  if (post.shelf) {
    return (
      <a
        href={`/bookshelf/${post.shelf.id}`}
        className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-lg mt-2"
      >
        🗂️ {post.shelf.title} by @{post.user?.username}
      </a>
    );
  }

  return null;
};

const formatPostText = (post) => {
  const { text, fic, shelf, user } = post;

  // Inline [fic] replacement
  if (fic && text.includes("[fic]")) {
    const parts = text.split("[fic]");
    return (
      <p className="mt-2 whitespace-pre-wrap">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part.trimEnd()}
            {index < parts.length - 1 && (
              <>
                {" "}
                <a
                  href={`/fic/${post.fic.id}`}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-lg mx-1"
                >
                  📖 {fic.title} by {fic.author}
                </a>{" "}
              </>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  }

  // Inline [shelf] replacement
  if (shelf && text.includes("[shelf]")) {
    const parts = text.split("[shelf]");
    return (
      <p className="mt-2 whitespace-pre-wrap">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <a
                href={`/bookshelf/${post.shelf.id}`}
                className="inline-block bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-lg mx-1"
              >
                🗂️ {shelf.title} by @{user?.username}
              </a>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  }

  // Default: just show text
  return <p className="mt-2 whitespace-pre-wrap">{text}</p>;
};

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* Composer */}
      <div className="mb-6 border rounded-lg p-4 shadow-sm bg-white">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setComposerOpen(!composerOpen)}
        >
          <span className="font-semibold">
            {composerOpen ? "Write something..." : "Start a post"}
          </span>
          {composerOpen ? <X size={20} /> : <Plus size={20} />}
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
              className="w-full p-2 border rounded-lg mb-2"
              rows="3"
              placeholder="What's on your mind?"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
            />
            <button
              onClick={handleCreatePost}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Post
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
        {posts.map((post) => {
          const includesFic = post.text.includes("[fic]");
          const includesShelf = post.text.includes("[shelf]");

          return (
            <div
              key={post.id}
              className="mb-6 border-b pb-4 border-gray-200 last:border-0"
            >
              {renderPostHeader(post)}

              {/* Only render this block IF it's not already in the text */}
              {!includesFic && !includesShelf && renderAttachedItem(post)}

              {formatPostText(post)}
            </div>
          );
        })}

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default Feed;
