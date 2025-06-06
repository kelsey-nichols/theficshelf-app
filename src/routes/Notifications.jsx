// src/components/NotificationsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

export default function NotificationsPage() {
  const { session } = UserAuth();
  const userId = session?.user?.id;

  // ─── Local state ──────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10); // how many to show initially
  const LAST_VIEW_KEY = "lastNotifViewed";

  // ─── Helpers to get/set “last viewed” timestamp ────────────────────────────────
  function getLastViewedTimestamp() {
    return localStorage.getItem(LAST_VIEW_KEY) || null;
  }
  function setLastViewedTimestamp(tsIsoString) {
    localStorage.setItem(LAST_VIEW_KEY, tsIsoString);
  }

  // ─── Fetch + combine notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    // 1) Fetch all posts *you* have created
    const { data: userPosts = [], error: postsError } = await supabase
      .from("posts")
      .select("id, text, fic_id, shelf_id, created_at")
      .eq("user_id", userId);

    if (postsError) {
      console.error("Error fetching your posts:", postsError);
      return;
    }
    const postIds = userPosts.map((p) => p.id);

    // 2) Fetch likes on your posts
    const { data: likesData = [] } = await supabase
      .from("likes")
      .select("user_id, post_id, created_at")
      .in("post_id", postIds);

    // 3) Fetch comments on your posts
    const { data: commentsData = [] } = await supabase
      .from("comments")
      .select("id, user_id, post_id, text, created_at")
      .in("post_id", postIds);

    // 4) Fetch new followers (someone started following YOU)
    const { data: followsData = [] } = await supabase
      .from("follows")
      .select("followers_id, created_at")
      .eq("following_id", userId);

    // 5) Fetch any shelf-bookmarks (someone bookmarked *any* of YOUR shelves)
    const { data: bookmarksData = [] } = await supabase
      .from("bookmarked_shelves")
      .select("user_id, shelf_id, created_at");

    // 6) Gather all “actor” user IDs (those who liked/commented/followed/bookmarked)
    const actorIdsSet = new Set([
      ...likesData.map((l) => l.user_id),
      ...commentsData.map((c) => c.user_id),
      ...followsData.map((f) => f.followers_id),
      ...bookmarksData.map((b) => b.user_id),
    ]);
    const actorIds = Array.from(actorIdsSet);

    // 7) Fetch profiles for those actors so we can show their usernames
    const { data: actorProfiles = [] } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", actorIds);

    const getUsername = (id) =>
      actorProfiles.find((u) => u.id === id)?.username || "someone";

    // 8) Fetch all fics (so we can replace “[fic]” tokens in post texts)
    //    (Assumes your “fics” table has columns: id, title, author)
    const { data: allFics = [] } = await supabase
      .from("fics")
      .select("id, title, author");

    const getFicReplacement = (fic_id) => {
      const fic = allFics.find((f) => f.id === fic_id);
      return fic ? `${fic.title} by ${fic.author}` : null;
    };

    // 9) Fetch all your shelves (so we can show shelf titles when someone bookmarks)
    const { data: yourShelves = [] } = await supabase
      .from("shelves")
      .select("id, title")
      .eq("user_id", userId);

    const getShelfTitle = (shelf_id) => {
      const shelf = yourShelves.find((s) => s.id === shelf_id);
      return shelf ? shelf.title : "your shelf";
    };

    // 10) Build a combined array of “notification objects”
    const combined = [];

    // 10.a) For each “like”
    likesData.forEach((like) => {
      // Find the post they liked
      const post = userPosts.find((p) => p.id === like.post_id);
      if (!post) return;

      // Replace “[fic]” tokens in the post text
      let displayText = post.text;
      const ficReplacement = getFicReplacement(post.fic_id);
      if (ficReplacement) {
        displayText = displayText.replace(/\[fic\]/gi, ficReplacement);
      }

      combined.push({
        id: `like-${like.user_id}-${like.post_id}-${like.created_at}`,
        type: "like",
        actorId: like.user_id,
        created_at: like.created_at,
        message: `@${getUsername(like.user_id)} liked your post.`,
        postContent: displayText,
      });
    });

    // 10.b) For each “comment”
    commentsData.forEach((comment) => {
      const post = userPosts.find((p) => p.id === comment.post_id);
      if (!post) return;

      let displayText = post.text;
      const ficReplacement = getFicReplacement(post.fic_id);
      if (ficReplacement) {
        displayText = displayText.replace(/\[fic\]/gi, ficReplacement);
      }

      combined.push({
        id: `comment-${comment.id}`,
        type: "comment",
        actorId: comment.user_id,
        created_at: comment.created_at,
        message: `@${getUsername(comment.user_id)} commented: “${comment.text}”`,
        postContent: displayText,
      });
    });

    // 10.c) For each “new follower”
    followsData.forEach((f) => {
      combined.push({
        id: `follow-${f.followers_id}-${f.created_at}`,
        type: "follow",
        actorId: f.followers_id,
        created_at: f.created_at,
        message: `@${getUsername(f.followers_id)} followed you.`,
        postContent: null, // no post content for follows
      });
    });

    // 10.d) For each “bookmarked shelf”
    bookmarksData.forEach((b) => {
      // Only include if that shelf belongs to you
      const isYourShelf = yourShelves.some((s) => s.id === b.shelf_id);
      if (!isYourShelf) return;

      combined.push({
        id: `bookmark-${b.user_id}-${b.shelf_id}-${b.created_at}`,
        type: "bookmark",
        actorId: b.user_id,
        created_at: b.created_at,
        message: `@${getUsername(b.user_id)} bookmarked “${getShelfTitle(
          b.shelf_id
        )}.”`,
        postContent: null, // no post content for bookmarks
      });
    });

    // 11) Sort descending by timestamp
    combined.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setNotifications(combined);

    // 12) Check if any notifications are “new” (arrived after last viewed)
    const lastViewedIso = getLastViewedTimestamp();
    if (!lastViewedIso) {
      setHasNew(combined.length > 0);
    } else {
      const lastViewed = new Date(lastViewedIso);
      const anyNew = combined.some(
        (n) => new Date(n.created_at).getTime() > lastViewed.getTime()
      );
      setHasNew(anyNew);
    }

    // 13) Mark “all seen” as soon as we load
    setLastViewedTimestamp(new Date().toISOString());
  }, [userId]);

  // ─── Trigger fetch when userId changes ─────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ─── Infinite scroll handler ──────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      // If the user has scrolled within 100px of the bottom, load 10 more
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= fullHeight - 100) {
        setVisibleCount((prev) => {
          // Don’t exceed total notifications length
          return Math.min(prev + 10, notifications.length);
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [notifications]);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#d3b7a4] text-[#202d26] p-6 font-serif">
      {/* Page title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">notifications</h1>
        {hasNew && (
          <span className="text-sm text-red-600 italic">new</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-[#886146]">You have no notifications.</p>
      ) : (
        <ul className="space-y-4">
          {/*
            Display only up to `visibleCount`.
            As you scroll down, `visibleCount` grows by 10 until it reaches notifications.length.
          */}
          {notifications.slice(0, visibleCount).map((n) => (
            <li
              key={n.id}
              className="p-4 rounded-lg bg-[#202d26] text-[#d3b7a4] border-l-4 border-[#886146]"
            >
              {/* 1) Main message (like/comment/follow/bookmark) */}
              <p className="text-sm">{n.message}</p>

              {/* 2) If it’s a like/comment on your post, show the post’s content below */}
              {n.postContent && (
                <div className="mt-2 p-3 bg-[#36433c] rounded">
                  <p className="text-xs italic">{n.postContent}</p>
                </div>
              )}

              {/* 3) Timestamp */}
              <p className="text-xs text-[#886146] mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </li>
          ))}

          {/*
            If we’ve shown all notifications, optionally show a message “No more”:
          */}
          {visibleCount >= notifications.length && (
            <li className="text-center text-[#886146] italic mt-4">
              You’re all caught up.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

