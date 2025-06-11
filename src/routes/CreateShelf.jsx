import { useState } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

// Predefined color options
const COLORS = {
  "deep grey": "#2e2c2b",
  grey: "#464c48",
  cocoa: "#442d1d",
  pumpkin: "#956241",
  caramel: "#84592c",
  "spiced wine": "#733015",
  "deep red": "#6e0e0a",
  "dusty rose": "#995643",
  "dark green": "#202d26",
  olive: "#4a5c46",
  green: "#4c9f70",
  "cambridge blue": "#6bab90",
  storm: "#6d8b8d",
  lapis: "#336699",
  "persian blue": "#3d52d5",
  violet: "#726da8",
  plum: "#412234",
  
};

// Map Supabase rows to { value, label } for react-select
const mapToOptions = (data) =>
  data.map((item) => ({ value: item.id, label: item.name || item.title }));

const CreateShelf = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS.moss);
  const [isPrivate, setIsPrivate] = useState(false);

  // Instead of comma-separated strings, we store arrays of { value, label }
  const [fandoms, setFandoms] = useState([]); // e.g. [{ value: 3, label: "Harry Potter" }, ...]
  const [relationships, setRelationships] = useState([]);
  const [tags, setTags] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load existing entries from Supabase for a given table
  const loadOptions = async (table, inputValue) => {
    if (!inputValue) return [];
    const { data, error } = await supabase
      .from(table)
      .select("id, name")
      .ilike("name", `%${inputValue}%`)
      .limit(20);

    if (error || !data) {
      console.error(`Error loading ${table}:`, error);
      return [];
    }
    return mapToOptions(data);
  };

  // Given an array of selected options, get or create each entry in the specified table,
  // then return an array of their IDs
  const getOrCreateEntries = async (table, values) => {
    
    const names = values
      .map((v) =>
        typeof v === "string"
          ? v.trim()
          : v.label?.toString().trim()     
      )
      .filter((name) => name && name.length > 0);

    const ids = [];

    for (const name of names) {
      const { data: existing, error: selectError } = await supabase
        .from(table)
        .select("id")
        .ilike("name", name)
        .limit(1);

      if (selectError && selectError.code !== "PGRST116") {
        throw selectError;
      }

      if (existing?.length) {
        ids.push(existing[0].id);
      } else {
        // 3) Insert using the trimmed name
        const { data: inserted, error: insertError } = await supabase
          .from(table)
          .insert([{ name }])
          .select("id")
          .single();

        if (insertError) throw insertError;
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
      // 1) Create the shelf row
      const { data: shelfData, error: shelfError } = await supabase
        .from("shelves")
        .insert({
          user_id: session.user.id,
          title,
          color,
          is_private: isPrivate,
          sort_order: 9999,
        })
        .select("id")
        .single();

      if (shelfError) {
        console.error("Error inserting shelf:", shelfError);
        setError("Failed to create shelf.");
        setSaving(false);
        return;
      }
      const shelfId = shelfData.id;

      // 2) Get or create IDs for fandoms, relationships, tags
      const fandomIds = await getOrCreateEntries("fandoms", fandoms);
      const relationshipIds = await getOrCreateEntries(
        "relationships",
        relationships
      );
      const tagIds = await getOrCreateEntries("tags", tags);

      // 3) Associate each ID in the join tables
      if (fandomIds.length) {
        const shelfFandoms = fandomIds.map((fandom_id) => ({
          shelf_id: shelfId,
          fandom_id,
        }));
        const { error: sfError } = await supabase
          .from("shelf_fandoms")
          .insert(shelfFandoms);
        if (sfError) {
          throw sfError;
        }
      }

      if (relationshipIds.length) {
        const shelfRelationships = relationshipIds.map(
          (relationship_id) => ({
            shelf_id: shelfId,
            relationship_id,
          })
        );
        const { error: srError } = await supabase
          .from("shelf_relationships")
          .insert(shelfRelationships);
        if (srError) {
          throw srError;
        }
      }

      if (tagIds.length) {
        const shelfTags = tagIds.map((tag_id) => ({
          shelf_id: shelfId,
          tag_id,
        }));
        const { error: stError } = await supabase
          .from("shelf_tags")
          .insert(shelfTags);
        if (stError) {
          throw stError;
        }
      }

      // 4) Done! Navigate back to the main bookshelf
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
      <div className="max-w-md mx-auto bg-[#886146] rounded-xl shadow-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#d3b7a4] text-center">
          create a new shelf
        </h1>

        {error && <p className="text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shelf Title */}
          <div>
            <div className="flex flex-col mb-4">
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="mt-1 p-3 rounded-full border text-[#886146] placeholder-[#a98c78] w-full"
                style={{
                  backgroundColor: "#d3b7a4",
                  borderColor: "#a98c78",
                }}
                placeholder="Enter shelf title"
              />
            </div>
          </div>

          {/* Color Swatches */}
          <div>
            <label className="block font-medium text-[#d3b7a4] mb-2">
              Shelf Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(COLORS).map(([name, hex]) => {
                const isSelected = color === hex;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setColor(hex)}
                    className={`
                      relative h-10 w-10 rounded-full border-2 focus:outline-none
                      ${isSelected ? "border-black" : "border-gray-200"}
                    `}
                    style={{ backgroundColor: hex }}
                    title={name}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <div className="h-4 w-4 rounded-full bg-[#d3b7a4]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-[#d3b7a4]">
              (Click a swatch to choose your shelf’s color)
            </p>
          </div>

          {/* Private Checkbox */}
          <div className="flex items-center gap-2">
            <input
              id="private"
              type="checkbox"
              checked={isPrivate}
              onChange={() => setIsPrivate((prev) => !prev)}
              className="accent-[#886146]"
            />
            <label htmlFor="private" className="text-sm text-[#d3b7a4]">
              Make shelf private
            </label>
          </div>

          {/* Fandoms Multi-Select */}
          <div className="flex flex-col mb-4">
            <label htmlFor="fandoms" className="block font-medium text-[#d3b7a4] mb-1">
              Fandom(s) (optional)
            </label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              value={fandoms}
              loadOptions={(input) => loadOptions("fandoms", input)}
              onChange={(vals) => setFandoms(vals || [])}
              placeholder="Type to search or create a fandom..."
              styles={{
                menu: (base) => ({ ...base, zIndex: 9999 }),
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "#d3b7a4",
                  borderColor: state.isFocused ? "#886146" : "#a98c78",
                  boxShadow: "none",
                  padding: "0.5rem",
                  borderRadius: "1rem",
                  "&:hover": {
                    borderColor: "#886146",
                  },
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#a98c78",
                }),
                input: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#f0eae2",
                  borderRadius: "9999px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#886146",
                  "&:hover": {
                    backgroundColor: "#886146",
                    color: "white",
                  },
                }),
              }}
            />
          </div>

          {/* Relationships Multi-Select */}
          <div className="flex flex-col mb-4">
            <label
              htmlFor="relationships"
              className="block font-medium text-[#d3b7a4] mb-1"
            >
              Relationship(s) (optional)
            </label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              value={relationships}
              loadOptions={(input) => loadOptions("relationships", input)}
              onChange={(vals) => setRelationships(vals || [])}
              placeholder="Type to search or create a relationship..."
              styles={{
                menu: (base) => ({ ...base, zIndex: 9999 }),
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "#d3b7a4",
                  borderColor: state.isFocused ? "#886146" : "#a98c78",
                  boxShadow: "none",
                  padding: "0.5rem",
                  borderRadius: "1rem",
                  "&:hover": {
                    borderColor: "#886146",
                  },
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#a98c78",
                }),
                input: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#f0eae2",
                  borderRadius: "9999px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#886146",
                  "&:hover": {
                    backgroundColor: "#886146",
                    color: "white",
                  },
                }),
              }}
            />
          </div>

          {/* Tags Multi-Select */}
          <div className="flex flex-col mb-4">
            <label htmlFor="tags" className="block font-medium text-[#d3b7a4] mb-1">
              Tag(s) (optional)
            </label>
            <AsyncCreatableSelect
              isMulti
              cacheOptions
              defaultOptions
              value={tags}
              loadOptions={(input) => loadOptions("tags", input)}
              onChange={(vals) => setTags(vals || [])}
              placeholder="Type to search or create a tag..."
              styles={{
                menu: (base) => ({ ...base, zIndex: 9999 }),
                control: (base, state) => ({
                  ...base,
                  backgroundColor: "#d3b7a4",
                  borderColor: state.isFocused ? "#886146" : "#a98c78",
                  boxShadow: "none",
                  padding: "0.5rem",
                  borderRadius: "1rem",
                  "&:hover": {
                    borderColor: "#886146",
                  },
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "#a98c78",
                }),
                input: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#f0eae2",
                  borderRadius: "9999px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  color: "#886146",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  color: "#886146",
                  "&:hover": {
                    backgroundColor: "#886146",
                    color: "white",
                  },
                }),
              }}
            />
          </div>

          {/* Submit / Cancel Buttons */}
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
              className="px-4 py-2 text-sm bg-[#202d26] text-[#d3b7a4] rounded hover:bg-[#704c2e]"
            >
              {saving ? "Creating..." : "CREATE SHELF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShelf;
