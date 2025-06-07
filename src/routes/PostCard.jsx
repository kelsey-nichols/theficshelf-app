import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, MessageCircleX, Ellipsis, Trash2, Flag, LibraryBig, Book } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const PostCard = ({ post, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndLikes = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError.message);
        return;
      }

      const userId = session?.user?.id;
      setCurrentUserId(userId);

      if (userId) {
        const { data: likeData, error: likeError } = await supabase
          .from("likes")
          .select("*")
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (likeError && likeError.code !== "PGRST116") {
          console.error("Error checking like status:", likeError.message);
        } else {
          setLiked(!!likeData);
        }
      }
    };

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, text, parent_id, profiles(username)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error.message);
      } else {
        const formattedComments = data.map((c) => ({
          id: c.id,
          text: c.text,
          parent_id: c.parent_id,
          user: { username: c.profiles.username },
        }));
        setComments(formattedComments);
      }
    };

    const fetchLikeCount = async () => {
    const { data, count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post.id);

    if (error) {
      console.error("Error fetching like count:", error.message);
      setLikeCount(0);
    } else {
      setLikeCount(count ?? 0);
    }
  };

  fetchUserAndLikes();
  fetchComments();
  fetchLikeCount();
}, [post.id]);

  const handleLikeToggle = async () => {
  if (!currentUserId) return;

  if (liked) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Error unliking post:", error.message);
    } else {
      setLiked(false);
      setLikeCount((count) => Math.max(0, count - 1));
    }
  } else {
    const { error } = await supabase.from("likes").insert([
      {
        post_id: post.id,
        user_id: currentUserId,
      },
    ]);

    if (error) {
      console.error("Error liking post:", error.message);
    } else {
      setLiked(true);
      setLikeCount((count) => count + 1);
    }
  }
};

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          text: commentText.trim(),
          post_id: post.id,
          user_id: currentUserId,
          parent_id: replyTo,
        },
      ])
      .select("id, text, parent_id, profiles(username)")
      .single();

    if (error) {
      console.error("Error submitting comment:", error.message);
    } else {
      const newComment = {
        id: data.id,
        text: data.text,
        parent_id: data.parent_id,
        user: { username: data.profiles.username },
      };
      setComments([...comments, newComment]);
      setCommentText("");
      setReplyTo(null);
    }
  };

  const handleReportPost = async () => {
    if (!currentUserId) {
      setReportError("You must be logged in to report a post.");
      return;
    }

    setReporting(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      const { error } = await supabase.from("reports").insert({
        post_id: post.id,
        reporter_id: currentUserId,
        reason: null, // You can extend this to accept a reason input
      });

      if (error) throw error;

      setReportSuccess("Post reported successfully.");
    } catch (error) {
      setReportError("Failed to report post. Please try again.");
      console.error("Report error:", error);
    } finally {
      setReporting(false);
    }
  };

  const renderPostHeader = () => {
    const name = post.user?.display_name || "Unknown";
    const handle = post.user?.username || "user";
    const time = formatDistanceToNow(new Date(post.created_at), {
      addSuffix: true,
    });

    return (
      <div className="text-sm text-gray-500">
        <span 
          className="font-bold text-[#202c28] cursor-pointer" 
          onClick={() => navigate(`/user/${handle}`)}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(`/user/${handle}`);
            }
          }}
        >
          {name}
        </span>{" "}
        <span className="text-[#826555] cursor-pointer" 
              onClick={() => navigate(`/user/${handle}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/user/${handle}`);
                }
              }}
        >
          @{handle}
        </span> · {time}
      </div>
    );
  };

  const renderAttachedItem = () => {
    if (post.fic && !post.text.includes("[fic]")) {
      return (
        <a
          href={`/fic/${post.fic.id}`}
          className="inline-flex items-center gap-2 bg-[#6d8b8d] text-[#D4B9A8] text-sm px-3 py-1 rounded-lg mt-2"
        >
          <Book className="w-4 h-4" />
          {post.fic.title} by {post.fic.author}
        </a>
      );
    }

    if (post.shelf && !post.text.includes("[shelf]")) {
      return (
        <a
          href={`/bookshelf/${post.shelf.id}`}
          className="inline-flex items-center gap-2 bg-[#34252F] text-[#D4B9A8] text-sm px-3 py-1 rounded-lg mt-2"
        >
          <LibraryBig className="w-4 h-4" />
          {post.shelf.title} by @{post.user?.username}
        </a>
      );
    }

    return null;
  };

  const formatPostText = () => {
    const { text, fic, shelf, user } = post;

    if (fic && text.includes("[fic]")) {
      const parts = text.split("[fic]");
      return (
        <p className="mt-2 whitespace-pre-wrap">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
            {part.trimEnd()}
            {index < parts.length - 1 && (
              <a
                href={`/fic/${fic.id}`}
                className="inline-flex items-center gap-2 bg-[#6d8b8d] text-[#D4B9A8] text-sm px-2 py-1 rounded-lg mx-1"
              >
                <Book className="w-4 h-4" />
                {fic.title} by {fic.author}
              </a>
            )}
          </React.Fragment>
          ))}
        </p>
      );
    }

    if (shelf && text.includes("[shelf]")) {
      const parts = text.split("[shelf]");
      return (
        <p className="mt-2 whitespace-pre-wrap">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <a
                href={`/bookshelf/${shelf.id}`}
                className="inline-flex items-center gap-2 bg-[#34252F] text-[#D4B9A8] text-sm px-2 py-1 rounded-lg mx-1"
              >
                <LibraryBig className="w-4 h-4" />
                {shelf.title} by @{user?.username}
              </a>
            )}
          </React.Fragment>
          ))}
        </p>
      );
    }

    return <p className="mt-2 whitespace-pre-wrap">{text}</p>;
  };

  const handleDeletePost = async () => {
    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", currentUserId);

      if (error) {
        console.error("Error deleting post:", error.message);
      } else {
        alert("Post deleted!");
        if (onDelete) onDelete(post.id);  // Pass post id to parent
      }
    } catch (err) {
      console.error("Delete post error:", err);
    }
    setMenuOpen(false);
  };


  const renderComments = () => {
    const topLevel = comments.filter((c) => !c.parent_id);
    const replies = (parentId) =>
      comments.filter((c) => c.parent_id === parentId);

    return topLevel.map((comment) => (
      <div key={comment.id} className="mt-2 ml-2">
        <div className="text-sm text-gray-700">
          <span className="font-semibold">@{comment.user.username}</span>:{" "}
          {comment.text}
        </div>
        <button
          onClick={() => setReplyTo(comment.id)}
          className="text-xs text-[#946241] hover:underline ml-1"
        >
          Reply
        </button>
        {replies(comment.id).map((reply) => (
          <div key={reply.id} className="ml-4 mt-1 text-sm text-gray-600">
            <span className="font-semibold">@{reply.user.username}</span>:{" "}
            {reply.text}
          </div>
        ))}
      </div>
    ));
  };

  return (
  <div className="border-b border-[#202D26] pb-4 mb-6">
    <div className="flex justify-between items-start relative">
      {renderPostHeader()}

      <div className="relative">
        {/* Ellipsis menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open post menu"
          className="p-1 rounded focus:outline-none"
        >
          <Ellipsis size={20} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-[#202d26] border border-gray-700 rounded shadow-lg z-10 p-1">
            {currentUserId === post.user_id ? (
              <button
                onClick={handleDeletePost}
                className="flex items-center gap-2 px-4 py-2  text-[#9a5643] w-full text-left rounded"
              >
                Delete <Trash2 size={16} color="#9a5643" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleReportPost}
                  disabled={reporting}
                  className="flex items-center gap-2 px-4 py-2 text-[#966443] w-full text-left rounded disabled:opacity-50"
                >
                  Report <Flag size={16} color="#966443" />
                </button>

                {reportError && (
                  <p className="text-[#d3b7a4] text-sm px-4 py-1 mt-1 rounded">
                    {reportError}
                  </p>
                )}
                {reportSuccess && (
                  <p className="text-[#d3b7a4] text-sm px-4 py-1 mt-1 rounded">
                    {reportSuccess}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {formatPostText()}
    {renderAttachedItem()}

    <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
      {/* Like button with icon and count */}
      <button
        onClick={handleLikeToggle}
        className="flex items-center gap-1 focus:outline-none"
        aria-label={liked ? "Unlike post" : "Like post"}
      >
        <Heart
          size={18}
          className={liked ? "fill-[#9b5744] text-[#9b5744]" : "text-[#494f4b]"}
        />
        <span>{likeCount}</span>
      </button>

      {/* Comments toggle button with icon and count */}
      <button
        type="button"
        onClick={() => setCommentsOpen(!commentsOpen)}
        className="flex items-center gap-1 text-[#976242] hover:underline focus:outline-none"
        aria-expanded={commentsOpen}
        aria-label={commentsOpen ? "Hide comments" : "View comments"}
      >
        {commentsOpen ? <MessageCircleX size={18} /> : <MessageCircle size={18} />}
        <span>{comments.length}</span>
      </button>
    </div>

    {commentsOpen && (
      <div className="mt-4">
        <div>{renderComments()}</div>

        <form onSubmit={handleCommentSubmit} className="mt-3">
          {replyTo && (
            <div className="text-xs text-gray-500 mb-1">
              Replying to comment
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-[#946241] ml-2"
              >
                Cancel
              </button>
            </div>
          )}
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border border-[#202d26] rounded bg-[#e5e0dc] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
          />
          <button
            type="submit"
            className="mt-2 bg-[#202c28] text-[#d4b9a8] px-4 py-2 rounded text-sm ml-auto"
          >
            COMMENT
          </button>
        </form>
      </div>
    )}
  </div>
);
};
export default PostCard;
