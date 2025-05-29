import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // make sure you import your initialized supabase client

const FicPage = () => {
  const { ficId } = useParams();
  const navigate = useNavigate();

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
      const { count, error: countError } = await supabase
        .from("reading_logs")
        .select("user_id", { count: "exact", head: true, distinct: "user_id" })
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

  const CollapsibleSection = ({ title, items, open, onToggle, emptyMessage }) => {
    return (
      <div
        style={{
          marginBottom: "1rem",
          cursor: "pointer",
          userSelect: "none",
          color: "#d5baa9",
          fontFamily: "serif",
        }}
        onClick={onToggle}
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
            {items.length > 0 ? items.map((item) => item.name).join(", ") : emptyMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#d5baa9",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "serif",
        position: "relative",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        style={{
          position: "absolute",
          top: "1.5rem",
          left: "1.5rem",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        <ChevronLeft size={24} color="#202d26" />
      </button>

      {/* Fic Info Block */}
      <div
        style={{
          backgroundColor: "#202d26",
          color: "#d5baa9",
          padding: "2rem",
          borderRadius: "8px",
          marginTop: "4rem",
          maxWidth: "800px",
        }}
      >
        <h1 style={{ margin: 0 }}>{fic.title}</h1>
        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
          by <strong>{fic.author}</strong>
        </p>
        <p>
          <a
            href={fic.link.startsWith("http") ? fic.link : `https://${fic.link}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#d5baa9", textDecoration: "underline" }}
          >
            Read Fic ↗
          </a>
        </p>
        <p>
          <strong>Summary:</strong> {fic.summary}
        </p>
        <p>
          <strong>Rating:</strong> {fic.rating}
        </p>
        <p>
          <strong>Category:</strong> {fic.category}
        </p>

        <CollapsibleSection
          title="Archive Warning(s)"
          items={relatedData.warnings.map((w) => ({ name: w }))}
          open
        />
        <CollapsibleSection
          title="Fandom(s)"
          items={relatedData.fandoms.map((name) => ({ name }))}
          open
        />
        <CollapsibleSection
          title="Relationship(s)"
          items={relatedData.relationships.map((name) => ({ name }))}
          open
        />
        <CollapsibleSection
          title="Character(s)"
          items={relatedData.characters.map((name) => ({ name }))}
          open
        />
        <CollapsibleSection
          title="Tags"
          items={relatedData.tags.map((name) => ({ name }))}
          open
        />

        <p style={{ marginTop: "1rem" }}>
          <strong>Words:</strong> {fic.words.toLocaleString()} &nbsp;&nbsp;
          <strong>Chapters:</strong> {fic.chapters}
        </p>
        <p>
          <strong>Kudos:</strong> {fic.kudos.toLocaleString()} &nbsp;&nbsp;
          <strong>Hits:</strong> {fic.hits.toLocaleString()}
        </p>

        {/* User count */}
        <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
          {userCount} user{userCount !== 1 ? "s" : ""} have logged this fic.
        </p>
      </div>
    </div>
  );
};

export default FicPage;
