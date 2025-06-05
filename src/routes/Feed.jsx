import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { Plus, X, Bell, BellDot } from "lucide-react";
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

  // ─── NOTIFICATIONS STATE ─────────────────────────────────────────────────────
  // Holds all notifications (likes + comments) on your posts
  const [notifications, setNotifications] = useState([]);
  // Toggles the dropdown
  const [showNotifications, setShowNotifications] = useState(false);
  // True if there are any “unseen” notifications
  const [hasNew, setHasNew] = useState(false);

  const userId = session?.user?.id;
  const notifContainerRef = useRef(null);

  // ─── UTILITY: get/set “last viewed” timestamp from localStorage ─────────────────
  const LAST_VIEW_KEY = "lastNotifViewed";
  function getLastViewedTimestamp() {
    return localStorage.getItem(LAST_VIEW_KEY) || null;
  }
  function setLastViewedTimestamp(tsIsoString) {
    localStorage.setItem(LAST_VIEW_KEY, tsIsoString);
  }

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

  // ─── 2) Fetch notifications (likes + comments on your posts) ────────────────────
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userId || posts.length === 0) {
        setNotifications([]);
        setHasNew(false);
        return;
      }

      // 2.a) Which post IDs belong to the current user?
      const ownPostIds = posts
        .filter((p) => p.user_id === userId)
        .map((p) => p.id);

      if (ownPostIds.length === 0) {
        setNotifications([]);
        setHasNew(false);
        return;
      }

      // 2.b) Fetch likes on those posts (no `id` column here)
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("user_id, post_id, created_at")
        .in("post_id", ownPostIds);
      if (likesError) {
        console.error("Error fetching likes:", likesError);
      }

      // 2.c) Fetch comments on those posts (comments table presumably has `id`)
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("id, user_id, post_id, text, created_at")
        .in("post_id", ownPostIds);
      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
      }

      // 2.d) Collect all actor user IDs to look up usernames
      const involvedUserIds = [
        ...new Set([
          ...(likesData || []).map((l) => l.user_id),
          ...(commentsData || []).map((c) => c.user_id),
        ]),
      ];

      // 2.e) Pull their usernames
      let usersMap = [];
      if (involvedUserIds.length > 0) {
        const { data: usersProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", involvedUserIds);
        usersMap = usersProfiles || [];
      }

// (f) Build a combined notifications array
  const combined = [];

  // → For each “like”: create a notification object
  (likesData || []).forEach((like) => {
    const actor = usersMap.find((u) => u.id === like.user_id);
    const post = posts.find((p) => p.id === like.post_id);
    const rawText = post?.text || "";

    // Replace every “[fic]” with “<title> by <author>”
    let displayText = rawText;
    if (post?.fic) {
      const ficReplacement = `${post.fic.title} by ${post.fic.author}`;
      // The /gi flag makes it global (all occurrences) and case‐insensitive
      displayText = rawText.replace(/\[fic\]/gi, ficReplacement);
    }

    // Construct a unique key (likes table has no `id` column)
    const uniqueKey = `like-${like.user_id}-${like.post_id}-${like.created_at}`;

    combined.push({
      id: uniqueKey,
      type: "like",
      username: actor?.username,
      displayText,      // text with all “[fic]” replaced
      created_at: like.created_at,
    });
  });

  // → For each “comment”: create a notification object
  (commentsData || []).forEach((comment) => {
    const actor = usersMap.find((u) => u.id === comment.user_id);
    const post = posts.find((p) => p.id === comment.post_id);
    const rawText = post?.text || "";

    // Replace every “[fic]” with “<title> by <author>”
    let displayText = rawText;
    if (post?.fic) {
      const ficReplacement = `${post.fic.title} by ${post.fic.author}`;
      displayText = rawText.replace(/\[fic\]/gi, ficReplacement);
    }

    // comment.id is unique in comments table
    const uniqueKey = `comment-${comment.id}`;

    combined.push({
      id: uniqueKey,
      type: "comment",
      username: actor?.username,
      displayText,      // text with “[fic]” replaced
      commentText: comment.text,
      created_at: comment.created_at,
    });
  });

      // 2.g) Sort descending by date
      combined.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(combined);

      // 2.h) Decide if any are strictly “new” (created after last viewed)
      const lastViewedIso = getLastViewedTimestamp();
      if (!lastViewedIso) {
        // If null, user never opened notifications → everything is “new”
        setHasNew(combined.length > 0);
      } else {
        const lastViewedDate = new Date(lastViewedIso);
        const anyNew = combined.some(
          (n) => new Date(n.created_at).getTime() > lastViewedDate.getTime()
        );
        setHasNew(anyNew);
      }
    };

    fetchNotifications();
  }, [userId, posts]);

  // ─── 3) Handle opening the notifications dropdown ───────────────────────────────
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);

    if (!showNotifications) {
      // If we are about to OPEN the dropdown, mark “seen” up to now:
      const nowIso = new Date().toISOString();
      setLastViewedTimestamp(nowIso);
      setHasNew(false);
    }
  };

  // ─── 4) Close dropdown if user clicks outside (do NOT clear notifications[])
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifContainerRef.current &&
        !notifContainerRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifContainerRef]);

  // ─── 5) Create a post ───────────────────────────────────────────────────────────
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
    // Force a refresh to re-fetch feed & notifications
    window.location.reload();
  };

  // ─── 6) Grab query params for sharing fic/shelf ─────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShareFicId(params.get("fic_id"));
    setShareShelfId(params.get("shelf_id"));
  }, [location.search]);

 return (
  <div className="min-h-screen bg-[#d3b7a4] font-serif">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6">
      {/* ================= HEADER (TITLE + NOTIFICATIONS) ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#202d26]">feed</h1>

        {/* Bell + dropdown container */}
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={handleBellClick}
            className="focus:outline-none p-1 rounded hover:bg-[#b0a087]"
            aria-label="Toggle notifications"
          >
            {hasNew ? (
              <BellDot size={24} color="#202d26" />
            ) : (
              <Bell size={24} color="#202d26" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[320px] max-w-[90vw] bg-[#202d26] shadow-lg rounded-lg max-h-80 overflow-y-auto z-50">
              {notifications.length === 0 ? (
                <p className="p-4 text-[#d3b7a4]">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 border-b border-[#d3b7a4] hover:bg-[#36433c] transition"
                  >
                    {n.type === "like" ? (
                      <p className="text-sm text-[#d3b7a4]">
                        <span className="font-semibold">@{n.username}</span> liked your post: “
                        {n.displayText}”
                      </p>
                    ) : (
                      <p className="text-sm text-[#d3b7a4]">
                        <span className="font-semibold">@{n.username}</span> commented on your post: “
                        {n.displayText}”<br />
                        <span className="italic text-[#886146]">“{n.commentText}”</span>
                      </p>
                    )}
                    <span className="text-xs text-[#886146]">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
