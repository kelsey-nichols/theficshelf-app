import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const CreateShelf = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#a7b89e");
  const [isPrivate, setIsPrivate] = useState(false);
  const [fandomsInput, setFandomsInput] = useState("");
  const [relationshipsInput, setRelationshipsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Helper function to process entries
  const processEntries = async (entries, tableName) => {
    const ids = [];

    for (const name of entries) {
      // Check if the entry exists
      const { data: existing, error: selectError } = await supabase
        .from(tableName)
        .select("id")
        .eq("name", name)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        // If error is not 'No rows found', handle it
        console.error(`Error checking ${tableName}:`, selectError);
        throw selectError;
      }

      if (existing) {
        ids.push(existing.id);
      } else {
        // Insert the new entry
        const { data: inserted, error: insertError } = await supabase
          .from(tableName)
          .insert({ name })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting into ${tableName}:`, insertError);
          throw insertError;
        }

        ids.push(inserted.id);
      }
    }

    return ids;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // Insert the shelf
      const { data: shelfData, error: shelfError } = await supabase
        .from("shelves")
        .insert({
          user_id: session.user.id,
          title,
          color,
          is_private: isPrivate,
          sort_order: 9999,
        })
        .select()
        .single();

      if (shelfError) {
        console.error("Error inserting shelf:", shelfError);
        setError("Failed to create shelf.");
        setSaving(false);
        return;
      }

      const shelfId = shelfData.id;

      // Process inputs
      const fandoms = fandomsInput
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
      const relationships = relationshipsInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      // Process and associate entries
      const fandomIds = await processEntries(fandoms, "fandoms");
      const relationshipIds = await processEntries(relationships, "relationships");
      const tagIds = await processEntries(tags, "tags");

      // Associate fandoms
      if (fandomIds.length > 0) {
        const shelfFandoms = fandomIds.map((fandom_id) => ({
          shelf_id: shelfId,
          fandom_id,
        }));
        const { error: sfError } = await supabase
          .from("shelf_fandoms")
          .insert(shelfFandoms);
        if (sfError) {
          console.error("Error inserting shelf_fandoms:", sfError);
          setError("Failed to associate fandoms.");
          setSaving(false);
          return;
        }
      }

      // Associate relationships
      if (relationshipIds.length > 0) {
        const shelfRelationships = relationshipIds.map((relationship_id) => ({
          shelf_id: shelfId,
          relationship_id,
        }));
        const { error: srError } = await supabase
          .from("shelf_relationships")
          .insert(shelfRelationships);
        if (srError) {
          console.error("Error inserting shelf_relationships:", srError);
          setError("Failed to associate relationships.");
          setSaving(false);
          return;
        }
      }

      // Associate tags
      if (tagIds.length > 0) {
        const shelfTags = tagIds.map((tag_id) => ({
          shelf_id: shelfId,
          tag_id,
        }));
        const { error: stError } = await supabase
          .from("shelf_tags")
          .insert(shelfTags);
        if (stError) {
          console.error("Error inserting shelf_tags:", stError);
          setError("Failed to associate tags.");
          setSaving(false);
          return;
        }
      }

      // Navigate to bookshelf
      navigate("/bookshelf");
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 bg-[#d3b7a4]">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#202d26]">Create a New Shelf</h1>

        {error && <p className="text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block font-medium text-gray-700">
              Shelf Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Color */}
          <div>
            <label htmlFor="color" className="block font-medium text-gray-700 mb-2">
              Shelf Color (hex code)
            </label>
            <input
              id="color"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#a7b89e"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
            <div className="mt-2 text-sm text-gray-600">
              Preview:{" "}
              <span
                className="inline-block w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              ></span>{" "}
              {color}
            </div>
          </div>

          {/* Private checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={() => setIsPrivate(!isPrivate)}
              className="accent-[#886146]"
            />
            <label htmlFor="private" className="text-sm text-gray-700">
              Make shelf private
            </label>
          </div>

          {/* Fandoms */}
          <div>
            <label htmlFor="fandoms" className="block font-medium text-gray-700">
              Fandom(s) (optional, comma separated)
            </label>
            <input
              id="fandoms"
              type="text"
              value={fandomsInput}
              onChange={(e) => setFandomsInput(e.target.value)}
              placeholder="e.g. Harry Potter, Marvel, Star Wars"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Relationships */}
          <div>
            <label htmlFor="relationships" className="block font-medium text-gray-700">
              Relationship(s) (optional, comma separated)
            </label>
            <input
              id="relationships"
              type="text"
              value={relationshipsInput}
              onChange={(e) => setRelationshipsInput(e.target.value)}
              placeholder="e.g. Remus/Sirius, Regulus/James"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block font-medium text-gray-700">
              Tag(s) (optional, comma separated)
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. fantasy, romance, angst"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/bookshelf")}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-[#886146] text-white rounded hover:bg-[#704c2e]"
            >
              {saving ? "Creating..." : "Create Shelf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShelf;

