import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { ChevronRight, ChevronLeft } from "lucide-react"; //

const ShelfPage = () => {
  const { shelfId } = useParams();
  const navigate = useNavigate(); // <-- Added useNavigate
  const [shelf, setShelf] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fandoms, setFandoms] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [tags, setTags] = useState([]);
  const [fics, setFics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showRelationships, setShowRelationships] = useState(false);
  const [showFandoms, setShowFandoms] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    if (!shelfId) return;

    const fetchShelfData = async () => {
      setLoading(true);

      const { data: shelfData, error: shelfError } = await supabase
        .from("shelves")
        .select("*")
        .eq("id", shelfId)
        .single();

      if (shelfError) {
        console.error("Error fetching shelf:", shelfError);
        setLoading(false);
        return;
      }
      setShelf(shelfData);

      if (shelfData?.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", shelfData.user_id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          setProfile(null);
        } else {
          setProfile(profileData);
        }
      }

      const fetchRelated = async (joinTable, relatedTable, joinColumn) => {
        const { data: joinData, error: joinError } = await supabase
          .from(joinTable)
          .select(joinColumn)
          .eq("shelf_id", shelfId);

        if (joinError) {
          console.error(`Error fetching from ${joinTable}:`, joinError);
          return [];
        }
        if (!joinData || joinData.length === 0) return [];

        const relatedIds = joinData.map((row) => row[joinColumn]);
        if (relatedIds.length === 0) return [];

        const { data: relatedData, error: relatedError } = await supabase
          .from(relatedTable)
          .select("id, name")
          .in("id", relatedIds);

        if (relatedError) {
          console.error(`Error fetching from ${relatedTable}:`, relatedError);
          return [];
        }

        return relatedData || [];
      };

      const [fandomsData, relationshipsData, tagsData] = await Promise.all([
        fetchRelated("shelf_fandoms", "fandoms", "fandom_id"),
        fetchRelated("shelf_relationships", "relationships", "relationship_id"),
        fetchRelated("shelf_tags", "tags", "tag_id"),
      ]);

      setFandoms(fandomsData);
      setRelationships(relationshipsData);
      setTags(tagsData);

      const { data: shelfFicsData, error: shelfFicsError } = await supabase
        .from("shelf_fic")
        .select("fic_id, position")
        .eq("shelf_id", shelfId)
        .order("position", { ascending: true });

      if (shelfFicsError) {
        console.error("Error fetching shelf_fic data:", shelfFicsError);
        setFics([]);
        setLoading(false);
        return;
      }

      if (!shelfFicsData || shelfFicsData.length === 0) {
        setFics([]);
        setLoading(false);
        return;
      }

      const ficIds = shelfFicsData.map((sf) => sf.fic_id);

      const { data: ficsData, error: ficsError } = await supabase
        .from("fics")
        .select("id, title, author")
        .in("id", ficIds);

      if (ficsError) {
        console.error("Error fetching fics:", ficsError);
        setFics([]);
        setLoading(false);
        return;
      }

      const ficsOrdered = shelfFicsData
        .map((sf) => ficsData.find((fic) => fic.id === sf.fic_id))
        .filter(Boolean);

      setFics(ficsOrdered);

      setLoading(false);
    };

    fetchShelfData();
  }, [shelfId]);

  if (loading) return <p>Loading shelf details...</p>;
  if (!shelf) return <p>Shelf not found.</p>;

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
    top: "1rem",
    left: "1.5rem",
    backgroundColor: "#d5baa9",
    padding: "0.3rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    zIndex: 10,
  }}
    >
      <ChevronLeft size={30} color="#202d26" />
    </button>

    {/* Shelf Info Block */}
    <div
      style={{
         backgroundColor: "#202d26",
          color: "#d5baa9",
          padding: "1.5rem 2rem",
          borderRadius: "8px",
          marginTop: "3rem", 
          marginBottom: "2rem",
          maxWidth: "600px", 
    }}
    >
        <h1 style={{ margin: 0 }}>{shelf.title || "Untitled Shelf"}</h1>
        <p style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
          Shelf created by: <strong>{profile?.username || "Unknown user"}</strong>
        </p>

        <CollapsibleSection
          title="Relationships"
          items={relationships}
          open={showRelationships}
          onToggle={() => setShowRelationships((prev) => !prev)}
          emptyMessage="No relationships listed."
        />
        <CollapsibleSection
          title="Fandoms"
          items={fandoms}
          open={showFandoms}
          onToggle={() => setShowFandoms((prev) => !prev)}
          emptyMessage="No fandoms listed."
        />
        <CollapsibleSection
          title="Tags"
          items={tags}
          open={showTags}
          onToggle={() => setShowTags((prev) => !prev)}
          emptyMessage="No tags listed."
        />
      </div>

      <section style={{ maxWidth: "600px" }}>
        <h2 style={{ color: "#202d26", fontFamily: "serif" }}>Fics</h2>
        {fics.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {fics.map((fic) => (
              <div
                key={fic.id}
                style={{
                  border: "2px solid #202d26",
                  borderRadius: "6px",
                  padding: "1rem",
                  color: "#202d26",
                  backgroundColor: "#d5baa9",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                onClick={() => navigate(`/fic/${fic.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      navigate(`/fic/${fic.id}`);
                    }
                  }}
                role="button"
                tabIndex={0}
                aria-label={`Open fic ${fic.title} by ${fic.author}`}
              >
                <strong>{fic.title}</strong> by {fic.author || "Unknown"}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#202d26" }}>No fics in this shelf.</p>
        )}
      </section>
    </div>
  );
};

export default ShelfPage;
