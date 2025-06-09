import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { UserAuth } from '../context/AuthContext';
import { differenceInDays, formatDistanceToNow } from "date-fns";
import TabBar from "./TabBar";
import PostCard from "./PostCard";

const CollapsibleSection = ({ title, items, emptyMessage }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      onClick={() => setOpen((prev) => !prev)}
      style={{
        marginBottom: "1rem",
        cursor: "pointer",
        userSelect: "none",
        color: "#d5baa9",
        fontFamily: "serif",
      }}
    >
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          margin: 0,
        }}
      >
        <ChevronRight
          size={16}
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        />
        {title}
      </h3>
      {open && (
        <p
          style={{
            marginLeft: "1.8rem",
            color: "#d5baa9",
            marginTop: "0.25rem",
          }}
        >
          {items.length > 0
            ? items.map((item) => item.name).join(", ")
            : emptyMessage || "None"}
        </p>
      )}
    </div>
  );
};

const UserPosts = ({ ficId, userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ficId || !userId) return;

    const fetchUserPosts = async () => {
      setLoading(true);
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("fic_id", ficId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching user posts:", postsError);
        setPosts([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", userId)
        .single();

      const { data: ficData } = await supabase
        .from("fics")
        .select("id, title, author")
        .eq("id", ficId)
        .single();

      const enrichedPosts = postsData.map((post) => ({
        ...post,
        user: profileData,
        fic: ficData,
      }));

      setPosts(enrichedPosts);
      setLoading(false);
    };

    fetchUserPosts();
  }, [ficId, userId]);

  if (loading) return <p>Loading your posts...</p>;
  if (posts.length === 0) return <p>No posts found for this fic.</p>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 text-left">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

const AllUsersNotes = ({ ficId }) => {
  const PAGE_SIZE = 10;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = async (targetPage = 1) => {
    if (!ficId) return;

    setLoading(true);

    const { data: notesData, error: notesError } = await supabase
      .from("reading_logs")
      .select("*")
      .eq("fic_id", ficId)
      .order("created_at", { ascending: false })
      .range((targetPage - 1) * PAGE_SIZE, targetPage * PAGE_SIZE - 1);

    if (notesError) {
      console.error("Error fetching notes:", notesError);
      setLoading(false);
      return;
    }

    const filteredNotes = notesData.filter(
      (note) => note.notes && note.notes.trim() !== ""
    );

    const userIds = [...new Set(filteredNotes.map((note) => note.user_id))];

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    const profilesMap = {};
    profilesData.forEach((profile) => {
      profilesMap[profile.id] = profile;
    });

    const enrichedNotes = filteredNotes.map((note) => ({
      ...note,
      profile: profilesMap[note.user_id] || null,
    }));

    if (enrichedNotes.length < PAGE_SIZE) {
      setHasMore(false);
    }

    setNotes((prev) => {
      const seen = new Set();
      const combined = [...prev, ...enrichedNotes];
      return combined.filter((note) => {
        const key = `${note.id}-${note.created_at}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    setLoading(false);
  };

  // Reset notes when ficId changes
  useEffect(() => {
    setNotes([]);
    setPage(1);
    setHasMore(true);
  }, [ficId]);

  // Fetch notes when ficId or page changes
  useEffect(() => {
    if (ficId) {
      fetchNotes(page);
    }
  }, [ficId, page]);

  const loadMore = () => {
    if (!loading && hasMore) setPage((p) => p + 1);
  };

  

  return (
    <div className="max-w-xl mx-auto px-4 py-6 font-serif text-[#202d26] text-left">
      {notes.length === 0 && !loading && <p>No notes found.</p>}

      {notes.map((note) => (
        <div
          key={note.id}
          className="mb-6 border-b border-gray-200 pb-4 last:border-0"
        >
          <p className="whitespace-pre-wrap font-serif text-[#202d26] mb-2">
            {note.notes?.trim() || ""}
          </p>

          <div className="text-sm text-[#886146]">
            <span className="font-semibold text-[#202d26]">
              {note.profile?.display_name || "Unknown"}
            </span>{" "}
            <span className="text-[#886146]">
              @{note.profile?.username || "user"}
            </span>{" "}
            ·{" "}
            {formatDistanceToNow(new Date(note.created_at), {
              addSuffix: true,
            })}
          </div>
        </div>
      ))}

      {loading && <p>Loading notes...</p>}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          className="bg-blue-500 hover:bg-blue-600 text-white font-serif px-4 py-2 rounded mb-4 cursor-pointer"
        >
          Load More
        </button>
      )}
    </div>
  );
};

const FicPage = () => {
  const { user } = UserAuth();
  const { ficId } = useParams();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  const [fic, setFic] = useState(null);
  const [relatedData, setRelatedData] = useState({ warnings: [], fandoms: [], relationships: [], characters: [], tags: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [activeTab, setActiveTab] = useState('posts');

  // Track whether this user has a reading log
  const [readingLog, setReadingLog] = useState(null);

  useEffect(() => {
    if (!ficId || !user?.id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Fetch main fic info
      const { data: ficData, error: ficError } = await supabase
        .from('fics')
        .select('*')
        .eq('id', ficId)
        .single();
      if (ficError) {
        setError(ficError.message);
        setLoading(false);
        return;
      }

      // Helper to fetch related names
      async function fetchRelated(joinTable, lookupTable) {
        const { data, error } = await supabase
          .from(joinTable)
          .select(`${lookupTable} ( name )`)
          .eq('fic_id', ficId);
        if (error) {
          console.error(`Error fetching ${lookupTable}:`, error);
          return [];
        }
        return data.map(item => item[lookupTable].name);
      }

      const warnings = ficData.archive_warning || [];
      const fandoms = await fetchRelated('fic_fandoms', 'fandoms');
      const relationships = await fetchRelated('fic_relationships', 'relationships');
      const characters = await fetchRelated('fic_characters', 'characters');
      const tags = await fetchRelated('fic_tags', 'tags');

      setFic(ficData);
      setRelatedData({ warnings, fandoms, relationships, characters, tags });

      // Fetch distinct user count
      const { countError, count } = await supabase
        .from('reading_logs')
        .select('user_id', { count: 'exact', distinct: 'user_id', head: true })
        .eq('fic_id', ficId);
      if (countError) {
        console.error('Error fetching user count:', countError);
        setUserCount(0);
      } else {
        setUserCount(count || 0);
      }

      // Fetch this user's reading log (only to show Sort option)
      const { data: logData, error: logError } = await supabase
        .from('reading_logs')
        .select('id')
        .eq('fic_id', ficId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (logError) console.error('Error fetching reading log:', logError);
      setReadingLog(logData);

      setLoading(false);
    };

    fetchData();
  }, [ficId, user]);

  const canEditFic = updatedAt => {
    if (!updatedAt) return false;
    return differenceInDays(new Date(), new Date(updatedAt)) >= 7;
  };
  const canEdit = fic ? canEditFic(fic.updated_at) : false;

  if (loading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;
  if (!fic) return <p>Fic not found.</p>;

  // Format full URL
  const makeFullUrl = raw => {
    if (!raw) return '#';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('www.')) return `https://${raw}`;
    return `https://www.${raw}`;
  };
  const fullFicUrl = makeFullUrl(fic.link);


  return (
    <div className="min-h-screen bg-[#d3b7a4] font-serif p-6 relative">
    {/* ─── BUTTON ROW ─── */}
    <div className="relative flex justify-end mb-4">
      <button
        onClick={toggleMenu}
        aria-label="Open fic actions menu"
        className="p-2 text-[#202d26] hover:text-[#886146] transition"
      >
        <MoreVertical size={24} />
      </button>

      {menuOpen && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      right: 0,
      backgroundColor: "#1a1a1a",
      border: "1px solid #333",
      borderRadius: "4px",
      padding: "0.5rem",
      marginTop: "0.25rem",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      minWidth: "160px",
    }}
  >
    <button
      onClick={() => navigate(`/log-fic/${fic.id}`, { state: { fic } })}
      style={{
        backgroundColor: "#d3b7a4",
        color: "#1a1a1a",
        border: "1px solid #886146",
        padding: "0.4rem 0.8rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontFamily: "serif",
        fontSize: "0.95rem",
      }}
    >
      Log Fic
    </button>

    <button
      onClick={() => navigate("/share-fic", { state: { fic } })}
      style={{
        backgroundColor: "#d3b7a4",
        color: "#1a1a1a",
        border: "1px solid #886146",
        padding: "0.4rem 0.8rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontFamily: "serif",
        fontSize: "0.95rem",
      }}
    >
      Share Fic
    </button>

    {/** only show Sort Fic if they’ve logged it already **/}
    {readingLog && (
      <button
        onClick={() => navigate(`/sort-fic/${fic.id}`, { state: { fic } })}
        style={{
          backgroundColor: "#d3b7a4",
          color: "#1a1a1a",
          border: "1px solid #886146",
          padding: "0.4rem 0.8rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "serif",
          fontSize: "0.95rem",
        }}
      >
        Sort Fic
      </button>
    )}

    <button
      onClick={() => navigate(`/edit-fic/${fic.id}`, { state: { fic } })}
      disabled={!canEdit}
      title={
        !canEdit
          ? "You can only edit this fic 7 days after its last update"
          : ""
      }
      style={{
        backgroundColor: canEdit ? "#d3b7a4" : "#666",
        color: canEdit ? "#1a1a1a" : "#ccc",
        border: "1px solid #886146",
        padding: "0.4rem 0.8rem",
        borderRadius: "4px",
        cursor: canEdit ? "pointer" : "not-allowed",
        fontFamily: "serif",
        fontSize: "0.95rem",
        opacity: canEdit ? 1 : 0.6,
      }}
    >
      Edit Fic
    </button>
  </div>
)}
    </div>

    {/* ─── Fic Info Card ─────────────────────────────────────────────── */}
  <div className="bg-[#202d26] rounded-2xl shadow-xl p-8 mb-8 text-[#d5baa9]">
    {/* Title & Author */}
    <h1 className="text-4xl font-serif mb-1">{fic.title}</h1>
    <p className="text-lg mb-4">
      by{" "}
      <span className="italic text-[#886146]">
        {fic.author || "Unknown Author"}
      </span>
    </p>

    {/* Link Button */}
    {fic.link && (
      <a
        href={fullFicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mb-4 px-4 py-2 bg-[#886146] text-[#d3b7a4] rounded-full font-semibold hover:bg-[#d5baa9] hover:text-[#202d26] transition"
      >
        read fic
      </a>
    )}

    {/* Summary */}
    <blockquote className="italic text-[#d5baa9] mb-6 border-l-4 border-[#886146] pl-4 whitespace-pre-wrap">
      {fic.summary || "No summary provided."}
    </blockquote>

    {/* Rating & Category */}
    <div className="flex flex-wrap gap-6 mb-6 text-base">
      <div>
        <span className="font-semibold">Rating:</span>{" "}
        {fic.rating || "Not Rated"}
      </div>
      <div>
        <span className="font-semibold">Category:</span>{" "}
        {fic.category || "Uncategorized"}
      </div>
    </div>

    {/* Collapsible Metadata */}
    <div className="space-y-4 mb-6">
      <CollapsibleSection
        title="Warnings"
        items={relatedData.warnings.map((w) => ({ name: w }))}
        emptyMessage="No warnings"
      />
      <CollapsibleSection
        title="Fandoms"
        items={relatedData.fandoms.map((name) => ({ name }))}
        emptyMessage="No fandoms"
      />
      <CollapsibleSection
        title="Relationships"
        items={relatedData.relationships.map((name) => ({ name }))}
        emptyMessage="No relationships"
      />
      <CollapsibleSection
        title="Characters"
        items={relatedData.characters.map((name) => ({ name }))}
        emptyMessage="No characters"
      />
      <CollapsibleSection
        title="Tags"
        items={relatedData.tags.map((name) => ({ name }))}
        emptyMessage="No tags"
      />
    </div>

    {/* Stats Row */}
    <div className="flex flex-wrap gap-8 text-base">
      <div>
        <span className="font-semibold">Chapters:</span>{" "}
        {fic.chapters ?? 0}
      </div>
      <div>
        <span className="font-semibold">Kudos:</span>{" "}
        {fic.kudos ?? 0}
      </div>
      <div>
        <span className="font-semibold">Hits:</span>{" "}
        {fic.hits ?? 0}
      </div>
    </div>
  </div>


      {/* 7) TabBar (Your Posts / All Users' Notes) */}
      <TabBar
        tabs={[
          { id: "posts", label: "Your Posts" },
          { id: "notes", label: "All Users' Notes" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 8) Scrollable content area below */}
      <div
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
          paddingTop: "1rem",
        }}
      >
        {activeTab === "posts" && (
          <UserPosts ficId={ficId} userId={user?.id} />
        )}
        {activeTab === "notes" && <AllUsersNotes ficId={ficId} />}
      </div>
    </div>
  );
};

export default FicPage;

