import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const ShelfPage = () => {
  const { shelfId } = useParams();
  const [shelf, setShelf] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fandoms, setFandoms] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [tags, setTags] = useState([]);
  const [fics, setFics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shelfId) return;

    const fetchShelfData = async () => {
      setLoading(true);

      // 1. Fetch shelf
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

      // 1a. Fetch profile based on shelfData.user_id
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

      // Helper to fetch related data via join tables
      const fetchRelated = async (joinTable, relatedTable, joinColumn) => {
        // Get related IDs from join table
        const { data: joinData, error: joinError } = await supabase
          .from(joinTable)
          .select(joinColumn)
          .eq("shelf_id", shelfId);

        if (joinError) {
          console.error(`Error fetching from ${joinTable}:`, joinError);
          return [];
        }
        if (!joinData || joinData.length === 0) {
          return [];
        }

        const relatedIds = joinData.map((row) => row[joinColumn]);
        if (relatedIds.length === 0) return [];

        // Debug logs
        console.log(`Join data from ${joinTable}:`, joinData);
        console.log(`Related IDs from ${relatedTable}:`, relatedIds);

        // Get details from related table
        const { data: relatedData, error: relatedError } = await supabase
          .from(relatedTable)
          .select("id, name")
          .in("id", relatedIds);

        if (relatedError) {
          console.error(`Error fetching from ${relatedTable}:`, relatedError);
          return [];
        }

        console.log(`Related data from ${relatedTable}:`, relatedData);
        return relatedData || [];
      };

      // 2. Fetch fandoms, relationships, tags
      const [fandomsData, relationshipsData, tagsData] = await Promise.all([
        fetchRelated("shelf_fandoms", "fandoms", "fandom_id"),
        fetchRelated("shelf_relationships", "relationships", "relationship_id"),
        fetchRelated("shelf_tags", "tags", "tag_id"),
      ]);

      setFandoms(fandomsData);
      setRelationships(relationshipsData);
      setTags(tagsData);

      // 3. Fetch fics directly related to shelf
      const { data: ficsData, error: ficsError } = await supabase
        .from("fics")
        .select("id, title, author")
        .eq("shelf_id", shelfId);

      if (ficsError) {
        console.error("Error fetching fics:", ficsError);
        setFics([]);
      } else {
        setFics(ficsData);
      }

      setLoading(false);
    };

    fetchShelfData();
  }, [shelfId]);

  if (loading) return <p>Loading shelf details...</p>;
  if (!shelf) return <p>Shelf not found.</p>;

  return (
    <div>
      <h1>{shelf.title || "Untitled Shelf"}</h1>
      <p>
        Shelf created by: <strong>{profile?.username || "Unknown user"}</strong>
      </p>

      <section>
        <h2>Relationships</h2>
        {relationships.length ? (
          <ul>
            {relationships.map((rel) => (
              <li key={rel.id}>{rel.name}</li>
            ))}
          </ul>
        ) : (
          <p>No relationships listed.</p>
        )}
      </section>

      <section>
        <h2>Fandoms</h2>
        {fandoms.length ? (
          <ul>
            {fandoms.map((fandom) => (
              <li key={fandom.id}>{fandom.name}</li>
            ))}
          </ul>
        ) : (
          <p>No fandoms listed.</p>
        )}
      </section>

      <section>
        <h2>Tags</h2>
        {tags.length ? (
          <ul>
            {tags.map((tag) => (
              <li key={tag.id}>{tag.name}</li>
            ))}
          </ul>
        ) : (
          <p>No tags listed.</p>
        )}
      </section>

      <section>
        <h2>Fics</h2>
        {fics.length ? (
          <ul>
            {fics.map((fic) => (
              <li key={fic.id}>
                <strong>{fic.title}</strong> by {fic.author || "Unknown"}
              </li>
            ))}
          </ul>
        ) : (
          <p>No fics in this shelf.</p>
        )}
      </section>
    </div>
  );
};

export default ShelfPage;
