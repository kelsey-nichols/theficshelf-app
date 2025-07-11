import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  ChevronRight,
  MoreVertical,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";

const ShelfPage = () => {
  const { shelfId } = useParams();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const [shelf, setShelf] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fandoms, setFandoms] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [tags, setTags] = useState([]);
  const [fics, setFics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bookmarkedShelves, setBookmarkedShelves] = useState(new Set());
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showRelationships, setShowRelationships] = useState(false);
  const [showFandoms, setShowFandoms] = useState(false);
  const [showTags, setShowTags] = useState(false);

  // Fetch shelf data (including related fandoms, relationships, tags, fics)
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
        fetchRelated(
          "shelf_relationships",
          "relationships",
          "relationship_id"
        ),
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

  // Fetch current user ID on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
        return;
      }
      setCurrentUserId(userData?.user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Fetch bookmarked shelves whenever shelfId or currentUserId changes
  useEffect(() => {
    const fetchBookmarkedShelves = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error);
        return;
      }

      const user = userData?.user;
      if (!user) return;

      const { data, error: bookmarkError } = await supabase
        .from("bookmarked_shelves")
        .select("shelf_id")
        .eq("user_id", user.id);

      if (bookmarkError) {
        console.error("Error fetching bookmarked shelves:", bookmarkError);
        return;
      }

      setBookmarkedShelves(new Set(data.map((b) => b.shelf_id)));
    };

    fetchBookmarkedShelves();
  }, [shelfId, currentUserId]);

  const toggleBookmark = async (shelfId, shelfOwnerId) => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return;
    }

    const user = userData?.user;
    if (!user) return;

    // Prevent bookmarking own shelf
    if (user.id === shelfOwnerId) {
      console.warn("You cannot bookmark your own shelf.");
      return;
    }

    const isBookmarked = bookmarkedShelves.has(shelfId);

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarked_shelves")
        .delete()
        .eq("shelf_id", shelfId)
        .eq("user_id", user.id);

      if (!error) {
        setBookmarkedShelves((prev) => {
          const updated = new Set(prev);
          updated.delete(shelfId);
          return updated;
        });
      }
    } else {
      const { error } = await supabase
        .from("bookmarked_shelves")
        .insert([{ user_id: user.id, shelf_id: shelfId }]);

      if (!error) {
        setBookmarkedShelves((prev) => new Set(prev).add(shelfId));
      }
    }
  };

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

  if (loading) return <p>Loading shelf details...</p>;
  if (!shelf) return <p>Shelf not found.</p>;

  return (
    <div
      style={{
        backgroundColor: "#d5baa9",
        minHeight: "100vh",
      }}
    >
      {/* Top Buttons */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          alignItems: "center",
          backgroundColor: "#d5baa9",
          padding: "1rem 0.25rem 0.25rem",
        }}
      >
        <button
          onClick={() => toggleBookmark(shelf.id, shelf.user_id)}
          disabled={currentUserId === shelf.user_id}
          title={
            currentUserId === shelf.user_id
              ? "You cannot bookmark your own shelf."
              : "Toggle bookmark"
          }
          style={{
            background: "transparent",
            border: "none",
            cursor: currentUserId === shelf.user_id ? "not-allowed" : "pointer",
          }}
        >
          {bookmarkedShelves.has(shelf.id) ? <BookmarkCheck /> : <Bookmark />}
        </button>

        <button
          onClick={toggleMenu}
          aria-label="Open shelf actions menu"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <MoreVertical size={20} color="#202d26" />
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
              minWidth: "150px",
            }}
          >
            <button
              onClick={() => navigate("/share-shelf", { state: { shelf } })}
              style={{
                backgroundColor: "#d5baa9",
                color: "#202d26",
                border: "1px solid #202d26",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "serif",
                fontWeight: "bold",
                transition: "background-color 0.2s ease, color 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#202d26";
                e.currentTarget.style.color = "#d5baa9";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#d5baa9";
                e.currentTarget.style.color = "#202d26";
              }}
            >
              Share Shelf
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2rem",
          paddingTop: "2rem",
          fontFamily: "serif",
        }}
      >
        {/* Shelf Info Block */}
        <div
          style={{
            backgroundColor: shelf.color || "#d5baa9",
            color: "#d5baa9",
            padding: "1.5rem 2rem",
            borderRadius: "8px",
            marginBottom: "1rem",
          }}
        >
          <h1 style={{ margin: 0 }}>{shelf.title || "Untitled Shelf"}</h1>
          <p
            style={{
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
              fontStyle: "italic",
            }}
          >
            Shelf created by:{" "}
            <strong>
              <Link
                to={`/user/${profile?.username}`}
                style={{ color: "#d5baa9", textDecoration: "underline" }}
              >
                {profile?.username || "Unknown user"}
              </Link>
            </strong>
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

        {/* Fics list */}
        <section>
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
    </div>
  );
};

export default ShelfPage;
