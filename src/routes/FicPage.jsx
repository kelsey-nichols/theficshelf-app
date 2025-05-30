import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";
import TabBar from "./TabBar"; 



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

// Component to display current user's posts for this fic
const UserPosts = ({ ficId, userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ficId || !userId) return;

    const fetchUserPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("fic_id", ficId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user posts:", error);
        setPosts([]);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchUserPosts();
  }, [ficId, userId]);

  if (loading) return <p>Loading your posts...</p>;
  if (posts.length === 0) return <p>No posts found for this fic.</p>;

  return (
    <div>
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            backgroundColor: "#202d26",
            color: "#d5baa9",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "6px",
          }}
        >
          <p style={{ marginBottom: "0.5rem" }}>{post.content}</p>
          <small>
            Posted on {new Date(post.created_at).toLocaleString()}
          </small>
        </div>
      ))}
    </div>
  );
};

// Component to display all users' notes on this fic, with pagination
const AllUsersNotes = ({ ficId }) => {
  const PAGE_SIZE = 10;
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!ficId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reading_logs")
      .select("*")
      .eq("fic_id", ficId)
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching notes:", error);
      setLoading(false);
      return;
    }

    if (data.length < PAGE_SIZE) {
      setHasMore(false);
    }

    setNotes((prev) => [...prev, ...data]);
    setLoading(false);
  }, [ficId, page]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Reset on ficId change
  useEffect(() => {
    setNotes([]);
    setPage(1);
    setHasMore(true);
  }, [ficId]);

  const loadMore = () => {
    if (!loading && hasMore) setPage((p) => p + 1);
  };

  return (
    <div>
      {notes.length === 0 && !loading && <p>No notes found.</p>}
      {notes.map((note) => (
        <div
          key={note.id}
          style={{
            backgroundColor: "#202d26",
            color: "#d5baa9",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            fontFamily: "Georgia, serif",
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {note.note?.trim() || <em>(No note content)</em>}
          </p>
          <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.8 }}>
            <strong>User:</strong> {note.user_id} <br />
            <strong>Logged on:</strong> {new Date(note.created_at).toLocaleString()}
          </div>
        </div>
      ))}

      {loading && <p>Loading notes...</p>}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          style={{
            backgroundColor: "#1DA1F2",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            marginBottom: "1rem",
            fontFamily: "inherit",
          }}
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
    </div>
  )}
</div>

        <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>
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
