import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import TabBar from "./TabBar"; 
import PostCard from "./PostCard";


const CollapsibleSection = ({ title, items, emptyMessage }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        marginBottom: "1rem",
        cursor: "pointer",
        userSelect: "none",
        color: "#d5baa9",
        fontFamily: "serif",
      }}
      onClick={() => setOpen((prev) => !prev)}
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
            transition: "transform 0.2s ease",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
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
    <div className="max-w-xl mx-auto px-4 py-6">
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

  const fetchNotes = useCallback(async () => {
  if (!ficId) return;
  setLoading(true);

  // Step 1: Fetch notes
  const { data: notesData, error: notesError } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("fic_id", ficId)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (notesError) {
    console.error("Error fetching notes:", notesError);
    setLoading(false);
    return;
  }

  // Filter empty notes
  const filteredNotes = notesData.filter(
    (note) => note.notes && note.notes.trim() !== ""
  );

  // Step 2: Get unique user_ids
  const userIds = [
    ...new Set(filteredNotes.map((note) => note.user_id)),
  ];

  // Step 3: Fetch profiles for these user IDs
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    setLoading(false);
    return;
  }

  // Step 4: Create a map of user_id to profile for quick lookup
  const profilesMap = {};
  profilesData.forEach((profile) => {
    profilesMap[profile.id] = profile;
  });

  // Step 5: Attach profile info to each note
  const enrichedNotes = filteredNotes.map((note) => ({
    ...note,
    profile: profilesMap[note.user_id] || null,
  }));

  if (enrichedNotes.length < PAGE_SIZE) {
    setHasMore(false);
  }

  setNotes((prev) => [...prev, ...enrichedNotes]);
  setLoading(false);
}, [ficId, page]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    setNotes([]);
    setPage(1);
    setHasMore(true);
  }, [ficId]);

  const loadMore = () => {
    if (!loading && hasMore) setPage((p) => p + 1);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 font-sans text-gray-800">
      {notes.length === 0 && !loading && <p>No notes found.</p>}

      {notes.map((note) => (
        <div key={note.id} className="mb-6 border-b border-gray-200 pb-4 last:border-0">
          <p className="whitespace-pre-wrap font-serif text-[#d5baa9] mb-2">
            {note.notes?.trim() || ""}
          </p>

          <div className="text-sm text-gray-500">
            <span className="font-semibold text-black">
              {note.profile?.display_name || "Unknown"}
            </span>{" "}
            <span className="text-gray-400">
              @{note.profile?.username || "user"}
            </span>{" "}
            ·{" "}
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
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
  const { ficId } = useParams();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);

  // TODO: Replace this with your actual user context or auth hook
  const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
      supabase.auth.getUser().then(({ data, error }) => {
        if (!error) setCurrentUser(data.user);
      });
    }, []);

  const [fic, setFic] = useState(null);
  const [relatedData, setRelatedData] = useState({
    warnings: [],
    fandoms: [],
    relationships: [],
    characters: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (!ficId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      // Fetch main fic info
      const { data: ficData, error: ficError } = await supabase
        .from("fics")
        .select("*")
        .eq("id", ficId)
        .single();

      if (ficError) {
        setError(ficError.message);
        setLoading(false);
        return;
      }

      // Helper: fetch related names through join + lookup tables
      async function fetchRelated(joinTable, lookupTable) {
        const { data, error } = await supabase
          .from(joinTable)
          .select(`${lookupTable} ( name )`)
          .eq("fic_id", ficId);

        if (error) {
          console.error(`Error fetching ${lookupTable}:`, error);
          return [];
        }

        return data.map((item) => item[lookupTable].name);
      }

      // Fetch related data arrays
      const warnings = ficData.archive_warning || [];
      const fandoms = await fetchRelated("fic_fandoms", "fandoms");
      const relationships = await fetchRelated("fic_relationships", "relationships");
      const characters = await fetchRelated("fic_characters", "characters");
      const tags = await fetchRelated("fic_tags", "tags");

      setFic(ficData);
      setRelatedData({ warnings, fandoms, relationships, characters, tags });

      // Fetch distinct user count who logged this fic
      const { countError, count } = await supabase
        .from("reading_logs")
        .select("user_id", { count: "exact", distinct: "user_id", head: true })
        .eq("fic_id", ficId);

      if (countError) {
        console.error("Error fetching user count:", countError);
        setUserCount(0);
      } else {
        setUserCount(count || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [ficId]);

  const canEditFic = (updatedAt) => {
    if (!updatedAt) return false;
    return differenceInDays(new Date(), new Date(updatedAt)) >= 7;
  };

  const canEdit = fic ? canEditFic(fic.updated_at) : false;

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!fic) return <p>Fic not found.</p>;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "'Georgia', serif",
        color: "#d5baa9",
      }}
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          backgroundColor: "transparent",
          border: "none",
          color: "#d5baa9",
          cursor: "pointer",
          marginBottom: "1rem",
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
        aria-label="Go back"
      >
        <ChevronLeft size={18} />
        Back
      </button>

      {/* Fic Info Header pinned top */}
      <div
        style={{
          position: "sticky",
          top: 0,
          backgroundColor: "#102020",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          zIndex: 10,
          boxShadow: "0 2px 5px rgba(0,0,0,0.7)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "0.25rem",
            fontFamily: "'Georgia', serif",
          }}
        >
          {fic.title}
        </h1>
        <p
          style={{
            marginTop: 0,
            marginBottom: "0.25rem",
            fontSize: "1.1rem",
          }}
        >
          by{" "}
          <a
            href={`/users/${fic.user_id}`}
            style={{ color: "#d5baa9", textDecoration: "italicized" }}
          >
            {fic.author || "Unknown Author"}
          </a>
        </p>

      {/* Menu button top-right */}
<div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
  <button
    onClick={toggleMenu}
    aria-label="Open fic actions menu"
    style={{
      background: "transparent",
      border: "none",
      color: "#d5baa9",
      cursor: "pointer",
    }}
  >
    <MoreVertical size={20} />
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
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        minWidth: "150px",
      }}
    >
      <button
        onClick={() => navigate(`/log-fic/${fic.id}`, { state: { fic } })}
        style={{
          backgroundColor: "#3d9970",
          color: "#fff",
          border: "none",
          padding: "0.5rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Log Fic
      </button>
      <button
        onClick={() => navigate("/share-fic", { state: { fic } })}
        style={{
          backgroundColor: "#0074D9",
          color: "#fff",
          border: "none",
          padding: "0.5rem",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Share Fic
      </button>

      <button
      onClick={() => navigate(`/edit-fic/${fic.id}`, { state: { fic } })}
      disabled={!canEdit}
      title={!canEdit ? "You can only edit this fic 7 days after its last update" : ""}
      style={{
        backgroundColor: canEdit ? "#FF851B" : "#555",
        color: "#fff",
        border: "none",
        padding: "0.5rem",
        borderRadius: "4px",
        cursor: canEdit ? "pointer" : "not-allowed",
        fontFamily: "inherit",
      }}
    >
      Edit Fic
    </button>

    </div>
  )}
</div>

        <p
          style={{
            margin: 0,
            fontStyle: "italic",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {fic.summary || "No summary provided."}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            marginTop: "0.5rem",
            fontSize: "0.9rem",
          }}
        >
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
          <div style={{ color: "#9e9e9e", marginTop: "auto" }}>
            {userCount} user{userCount !== 1 ? "s" : ""} reading
          </div>
        </div>
      </div>

      {/* TabBar */}
      <TabBar
        tabs={[
          { id: "posts", label: "Your Posts" },
          { id: "notes", label: "All Users' Notes" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab content container with scroll */}
      <div
        style={{
          maxHeight: "60vh",
          overflowY: "auto",
          paddingTop: "1rem",
        }}
      >
        {activeTab === "posts" && (
          <UserPosts ficId={ficId} userId={currentUser.id} />
        )}
        {activeTab === "notes" && <AllUsersNotes ficId={ficId} />}
      </div>
    </div>
  );
};

export default FicPage;
