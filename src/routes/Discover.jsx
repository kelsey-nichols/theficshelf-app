// src/routes/DiscoverPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import TabBar from "./TabBar"; // or wherever your TabBar lives

export default function DiscoverPage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // ─── GLOBAL STATE ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("fics");

  // ─── COMMON “TYPEAHEAD” STATE & SUGGESTIONS ─────────────────────────────────
  const [fandomText, setFandomText] = useState("");
  const [relationshipText, setRelationshipText] = useState("");
  const [tagText, setTagText] = useState("");
  const [fandomSuggestions, setFandomSuggestions] = useState([]);
  const [relationshipSuggestions, setRelationshipSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFandomSuggestions([]);
        setRelationshipSuggestions([]);
        setTagSuggestions([]);
        setUserSuggestions([]);
        setAuthorSuggestions([]);
        setShelfTitleSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch type-ahead suggestions for any of the three tabs based on current text
  useEffect(() => {
    async function fetchAllSuggestions() {
      // ── For FICS tab ───────────────────────────────────────────────
      if (activeTab === "fics") {
        // Fetch fandom suggestions
        if (fandomText.trim()) {
          let { data, error } = await supabase
            .from("fandoms")
            .select("id, name")
            .ilike("name", `%${fandomText.trim()}%`)
            .limit(8);
          setFandomSuggestions(error ? [] : data || []);
        } else {
          setFandomSuggestions([]);
        }

        // Fetch relationship suggestions
        if (relationshipText.trim()) {
          let { data, error } = await supabase
            .from("relationships")
            .select("id, name")
            .ilike("name", `%${relationshipText.trim()}%`)
            .limit(8);
          setRelationshipSuggestions(error ? [] : data || []);
        } else {
          setRelationshipSuggestions([]);
        }

        // Fetch tag suggestions
        if (tagText.trim()) {
          let { data, error } = await supabase
            .from("tags")
            .select("id, name")
            .ilike("name", `%${tagText.trim()}%`)
            .limit(8);
          setTagSuggestions(error ? [] : data || []);
        } else {
          setTagSuggestions([]);
        }
      }

      // ── For SHELVES tab ────────────────────────────────────────────
      else if (activeTab === "shelves") {
        // fandoms (same as above)
        if (fandomText.trim()) {
          let { data, error } = await supabase
            .from("fandoms")
            .select("id, name")
            .ilike("name", `%${fandomText.trim()}%`)
            .limit(8);
          setFandomSuggestions(error ? [] : data || []);
        } else {
          setFandomSuggestions([]);
        }

        // relationships
        if (relationshipText.trim()) {
          let { data, error } = await supabase
            .from("relationships")
            .select("id, name")
            .ilike("name", `%${relationshipText.trim()}%`)
            .limit(8);
          setRelationshipSuggestions(error ? [] : data || []);
        } else {
          setRelationshipSuggestions([]);
        }

        // tags
        if (tagText.trim()) {
          let { data, error } = await supabase
            .from("tags")
            .select("id, name")
            .ilike("name", `%${tagText.trim()}%`)
            .limit(8);
          setTagSuggestions(error ? [] : data || []);
        } else {
          setTagSuggestions([]);
        }
      }

      // ── For USERS tab ─────────────────────────────────────────────
      else if (activeTab === "users") {
        // we’ll handle username suggestions below in a separate state
        // (see user section)
      }
    }

    fetchAllSuggestions();
  }, [activeTab, fandomText, relationshipText, tagText]);

  // ─── “FICS” TAB STATE ──────────────────────────────────────────────────────
  const [titleText, setTitleText] = useState("");
  const [authorText, setAuthorText] = useState("");
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedFandoms, setSelectedFandoms] = useState([]);
  const [selectedRelationships, setSelectedRelationships] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Fetch author suggestions when authorText changes
  useEffect(() => {
    if (activeTab !== "fics") return;
    async function fetchAuthors() {
      if (!authorText.trim()) {
        setAuthorSuggestions([]);
        return;
      }
      let { data, error } = await supabase
        .from("fics")
        .select("author")
        .ilike("author", `%${authorText.trim()}%`)
        .limit(8);
      if (error) {
        console.error(error);
        setAuthorSuggestions([]);
      } else {
        const unique = Array.from(new Set(data.map((r) => r.author))).filter(
          (a) => a
        );
        setAuthorSuggestions(unique.slice(0, 8));
      }
    }
    fetchAuthors();
  }, [activeTab, authorText]);

  // ─── “SHELVES” TAB STATE ───────────────────────────────────────────────────
  const [shelfTitleText, setShelfTitleText] = useState("");
  const [shelfTitleSuggestions, setShelfTitleSuggestions] = useState([]);
  const [selectedShelfTitles, setSelectedShelfTitles] = useState([]);
  const [selectedShelfFandoms, setSelectedShelfFandoms] = useState([]);
  const [selectedShelfRelationships, setSelectedShelfRelationships] = useState([]);
  const [selectedShelfTags, setSelectedShelfTags] = useState([]);

  // Fetch shelf‐title suggestions when shelfTitleText changes
  useEffect(() => {
    if (activeTab !== "shelves") return;
    async function fetchShelfTitles() {
      if (!shelfTitleText.trim()) {
        setShelfTitleSuggestions([]);
        return;
      }
      let { data, error } = await supabase
        .from("shelves")
        .select("id, title")
        .ilike("title", `%${shelfTitleText.trim()}%`)
        .eq("is_private", false)
        .limit(8);
      if (error) {
        console.error(error);
        setShelfTitleSuggestions([]);
      } else {
        setShelfTitleSuggestions(data || []);
      }
    }
    fetchShelfTitles();
  }, [activeTab, shelfTitleText]);

  // ─── “USERS” TAB STATE ─────────────────────────────────────────────────────
  const [usernameText, setUsernameText] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch user suggestions when usernameText changes
  useEffect(() => {
    if (activeTab !== "users") return;
    async function fetchUsers() {
      if (!usernameText.trim()) {
        setUserSuggestions([]);
        return;
      }
      let { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${usernameText.trim()}%`)
        .limit(8);
      if (error) {
        console.error(error);
        setUserSuggestions([]);
      } else {
        setUserSuggestions(data || []);
      }
    }
    fetchUsers();
  }, [activeTab, usernameText]);

  // ─── ADD / REMOVE “PILL” HELPERS ────────────────────────────────────────────
  // Fics
  const addAuthor = (name) => {
    if (!selectedAuthors.includes(name)) {
      setSelectedAuthors([...selectedAuthors, name]);
    }
    setAuthorText("");
    setAuthorSuggestions([]);
  };
  const removeAuthor = (name) => {
    setSelectedAuthors(selectedAuthors.filter((a) => a !== name));
  };
  const addFandom = (fandom) => {
    if (!selectedFandoms.find((f) => f.id === fandom.id)) {
      setSelectedFandoms([...selectedFandoms, fandom]);
    }
    setFandomText("");
    setFandomSuggestions([]);
  };
  const removeFandom = (id) => {
    setSelectedFandoms(selectedFandoms.filter((f) => f.id !== id));
  };
  const addRelationship = (rel) => {
    if (!selectedRelationships.find((r) => r.id === rel.id)) {
      setSelectedRelationships([...selectedRelationships, rel]);
    }
    setRelationshipText("");
    setRelationshipSuggestions([]);
  };
  const removeRelationship = (id) => {
    setSelectedRelationships(
      selectedRelationships.filter((r) => r.id !== id)
    );
  };
  const addTag = (tag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagText("");
    setTagSuggestions([]);
  };
  const removeTag = (id) => {
    setSelectedTags(selectedTags.filter((t) => t.id !== id));
  };

  // Shelves
  const addShelfTitle = (shelf) => {
    if (!selectedShelfTitles.find((s) => s.id === shelf.id)) {
      setSelectedShelfTitles([...selectedShelfTitles, shelf]);
    }
    setShelfTitleText("");
    setShelfTitleSuggestions([]);
  };
  const removeShelfTitle = (id) => {
    setSelectedShelfTitles(
      selectedShelfTitles.filter((s) => s.id !== id)
    );
  };
  const addShelfFandom = (fandom) => {
    if (!selectedShelfFandoms.find((f) => f.id === fandom.id)) {
      setSelectedShelfFandoms([...selectedShelfFandoms, fandom]);
    }
    setFandomText("");
    setFandomSuggestions([]);
  };
  const removeShelfFandom = (id) => {
    setSelectedShelfFandoms(
      selectedShelfFandoms.filter((f) => f.id !== id)
    );
  };
  const addShelfRelationship = (rel) => {
    if (!selectedShelfRelationships.find((r) => r.id === rel.id)) {
      setSelectedShelfRelationships([...selectedShelfRelationships, rel]);
    }
    setRelationshipText("");
    setRelationshipSuggestions([]);
  };
  const removeShelfRelationship = (id) => {
    setSelectedShelfRelationships(
      selectedShelfRelationships.filter((r) => r.id !== id)
    );
  };
  const addShelfTag = (tag) => {
    if (!selectedShelfTags.find((t) => t.id === tag.id)) {
      setSelectedShelfTags([...selectedShelfTags, tag]);
    }
    setTagText("");
    setTagSuggestions([]);
  };
  const removeShelfTag = (id) => {
    setSelectedShelfTags(selectedShelfTags.filter((t) => t.id !== id));
  };

  // Users
  const addUser = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUsernameText("");
    setUserSuggestions([]);
  };
  const removeUser = (id) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  // ─── “RUN SEARCH” FOR EACH TAB ──────────────────────────────────────────────
const runSearch = async () => {
  setLoading(true);

  // ── FICS TAB ───────────────────────────────────────────────────────────────
  if (activeTab === "fics") {
    // 1) Build filter‐ID sets exactly as before…
    let titleIds = null;
    if (titleText.trim()) {
      const { data, error } = await supabase
        .from("fics")
        .select("id")
        .ilike("title", `%${titleText.trim()}%`);
      if (error) {
        console.error(error);
        titleIds = [];
      } else {
        titleIds = data.map((r) => r.id);
      }
    }

    let authorIds = null;
    if (selectedAuthors.length > 0) {
      const { data, error } = await supabase
        .from("fics")
        .select("id")
        .in("author", selectedAuthors);
      if (error) {
        console.error(error);
        authorIds = [];
      } else {
        authorIds = data.map((r) => r.id);
      }
    }

    let fandomIds = null;
    if (selectedFandoms.length > 0) {
      const idsArr = selectedFandoms.map((f) => f.id);
      const { data, error } = await supabase
        .from("fic_fandoms")
        .select("fic_id")
        .in("fandom_id", idsArr);
      if (error) {
        console.error(error);
        fandomIds = [];
      } else {
        fandomIds = [...new Set(data.map((r) => r.fic_id))];
      }
    }

    let relationshipIds = null;
    if (selectedRelationships.length > 0) {
      const idsArr = selectedRelationships.map((r) => r.id);
      const { data, error } = await supabase
        .from("fic_relationships")
        .select("fic_id")
        .in("relationship_id", idsArr);
      if (error) {
        console.error(error);
        relationshipIds = [];
      } else {
        relationshipIds = [...new Set(data.map((r) => r.fic_id))];
      }
    }

    let tagIds = null;
    if (selectedTags.length > 0) {
      const idsArr = selectedTags.map((t) => t.id);
      const { data, error } = await supabase
        .from("fic_tags")
        .select("fic_id")
        .in("tags_id", idsArr);
      if (error) {
        console.error(error);
        tagIds = [];
      } else {
        tagIds = [...new Set(data.map((r) => r.fic_id))];
      }
    }

    // Intersect all non‐null ID sets
    const sets = [titleIds, authorIds, fandomIds, relationshipIds, tagIds].filter(
      (s) => s !== null
    );
    let finalIds = [];
    if (sets.length === 0) {
      // No filters → fetch all fic IDs
      const { data: all, error: allErr } = await supabase
        .from("fics")
        .select("id");
      if (allErr) console.error(allErr);
      finalIds = all.map((r) => r.id);
    } else {
      // Intersect
      finalIds = sets[0];
      for (let i = 1; i < sets.length; i++) {
        finalIds = finalIds.filter((id) => sets[i].includes(id));
      }
    }

    // PAGINATION logic for fics
    if (finalIds.length === 0) {
      setResults([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE - 1;
    const pageIds = finalIds.slice(start, end + 1);

    if (pageIds.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    const { data: ficRows, error: ficErr } = await supabase
      .from("fics")
      .select(
        "id, title, author, summary, created_at, updated_at, hits, kudos"
      )
      .in("id", pageIds)
      .order("created_at", { ascending: false });

    if (ficErr) {
      console.error(ficErr);
      setResults([]);
      setLoading(false);
      return;
    }

    setResults((prev) => (page === 1 ? ficRows : [...prev, ...ficRows]));
    setHasMore(ficRows.length === PAGE_SIZE);
    setLoading(false);
  }

  // ── SHELVES TAB ─────────────────────────────────────────────────────────────
  else if (activeTab === "shelves") {
    // 1) Title filter (public shelves only)
    let titleIds = null;
    if (shelfTitleText.trim()) {
      const { data, error } = await supabase
        .from("shelves")
        .select("id")
        .ilike("title", `%${shelfTitleText.trim()}%`)
        .eq("is_private", false);
      if (error) {
        console.error(error);
        titleIds = [];
      } else {
        titleIds = data.map((r) => r.id);
      }
    }

    // 2) Fandom filter (for public shelves)
    let fandomIds = null;
    if (selectedShelfFandoms.length > 0) {
      const idsArr = selectedShelfFandoms.map((f) => f.id);
      const { data, error } = await supabase
        .from("shelf_fandoms")
        .select("shelf_id")
        .in("fandom_id", idsArr);
      if (error) {
        console.error(error);
        fandomIds = [];
      } else {
        fandomIds = [...new Set(data.map((r) => r.shelf_id))];
      }
    }

    // 3) Relationship filter
    let relationshipIds = null;
    if (selectedShelfRelationships.length > 0) {
      const idsArr = selectedShelfRelationships.map((r) => r.id);
      const { data, error } = await supabase
        .from("shelf_relationships")
        .select("shelf_id")
        .in("relationship_id", idsArr);
      if (error) {
        console.error(error);
        relationshipIds = [];
      } else {
        relationshipIds = [...new Set(data.map((r) => r.shelf_id))];
      }
    }

    // 4) Tag filter
    let tagIds = null;
    if (selectedShelfTags.length > 0) {
      const idsArr = selectedShelfTags.map((t) => t.id);
      const { data, error } = await supabase
        .from("shelf_tags")
        .select("shelf_id")
        .in("tag_id", idsArr);
      if (error) {
        console.error(error);
        tagIds = [];
      } else {
        tagIds = [...new Set(data.map((r) => r.shelf_id))];
      }
    }

    // Intersect non‐null ID sets
    const sets = [titleIds, fandomIds, relationshipIds, tagIds].filter(
      (s) => s !== null
    );
    let finalIds = [];
    if (sets.length === 0) {
      // fetch all public shelf IDs
      const { data: all, error: allErr } = await supabase
        .from("shelves")
        .select("id")
        .eq("is_private", false);
      if (allErr) console.error(allErr);
      finalIds = all.map((r) => r.id);
    } else {
      finalIds = sets[0];
      for (let i = 1; i < sets.length; i++) {
        finalIds = finalIds.filter((id) => sets[i].includes(id));
      }
    }

    // PAGINATION logic for shelves
    if (finalIds.length === 0) {
      setResults([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    const start = (page - 1) * PAGE_SIZE;
    const end = page * PAGE_SIZE - 1;
    const pageIds = finalIds.slice(start, end + 1);

    if (pageIds.length === 0) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    const { data: shelfRows, error: shelfErr } = await supabase
      .from("shelves")
      .select("id, title, color, user_id")
      .in("id", pageIds)
      .eq("is_private", false)
      .order("title", { ascending: true });

    if (shelfErr) {
      console.error(shelfErr);
      setResults([]);
      setLoading(false);
      return;
    }

    setResults((prev) => (page === 1 ? shelfRows : [...prev, ...shelfRows]));
    setHasMore(shelfRows.length === PAGE_SIZE);
    setLoading(false);
  }

  // ── USERS TAB ──────────────────────────────────────────────────────────────
  else if (activeTab === "users") {
    if (selectedUsers.length === 0) {
      setResults([]);
      setLoading(false);
    } else {
      const ids = selectedUsers.map((u) => u.id);
      const { data: usersData, error: usersErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio")
        .in("id", ids)
        .order("username", { ascending: true });
      if (usersErr) {
        console.error(usersErr);
        setResults([]);
      } else {
        setResults(usersData || []);
      }
      setLoading(false);
    }
  }
};

  // re-run search when any dependency changes
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    titleText,
    authorText,
    selectedAuthors,
    selectedFandoms,
    selectedRelationships,
    selectedTags,
    shelfTitleText,
    selectedShelfTitles,
    selectedShelfFandoms,
    selectedShelfRelationships,
    selectedShelfTags,
    usernameText,
    selectedUsers,
    page,
  ]);

  useEffect(() => {
  setPage(1);
  setHasMore(true);
}, [
  activeTab,
  titleText,
  authorText,
  selectedAuthors,
  selectedFandoms,
  selectedRelationships,
  selectedTags,
  shelfTitleText,
  selectedShelfTitles,
  selectedShelfFandoms,
  selectedShelfRelationships,
  selectedShelfTags,
  usernameText,
  selectedUsers,
]);

return (
  <div className="min-h-screen bg-[#d3b7a4] p-6 font-serif text-[#202d26]">
    <h1 className="text-2xl font-bold mb-4">Discover</h1>

    {/* ─── TABS ─────────────────────────────────────────────────────────────── */}
    <TabBar
      tabs={[
        { id: "fics", label: "Fics" },
        { id: "shelves", label: "Shelves" },
        { id: "users", label: "Users" },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />

<div ref={containerRef} className="mt-6">
    {/* ─── FICS TAB ─────────────────────────────────────────────────────────── */}
    {activeTab === "fics" && (
      <>
        {/* Title input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by title…"
            value={titleText}
            onChange={(e) => setTitleText(e.target.value)}
            className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
          />
        </div>

        {/* Author typeahead */}
        <div className="mb-2 relative">
          <input
            type="text"
            placeholder="Search by author…"
            value={authorText}
            onChange={(e) => setAuthorText(e.target.value)}
            className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
          />
          {authorSuggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
              {authorSuggestions.map((name) => (
                <li
                  key={name}
                  onClick={() => addAuthor(name)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected author pills */}
        {selectedAuthors.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedAuthors.map((name) => (
              <span
                key={name}
                className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
              >
                {name}
                <button
                  onClick={() => removeAuthor(name)}
                  className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Fandom / Relationship / Tag typeaheads */}
        <div className="flex flex-col space-y-4 mb-6">
          {/* Fandom */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by fandom…"
              value={fandomText}
              onChange={(e) => setFandomText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {fandomSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {fandomSuggestions.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => addFandom(f)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}

            {/* Selected fandom pills */}
            {selectedFandoms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFandoms.map((f) => (
                  <span
                    key={f.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {f.name}
                    <button
                      onClick={() => removeFandom(f.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Relationship */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by relationship…"
              value={relationshipText}
              onChange={(e) => setRelationshipText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {relationshipSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {relationshipSuggestions.map((r) => (
                  <li
                    key={r.id}
                    onClick={() => addRelationship(r)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {r.name}
                  </li>
                ))}
              </ul>
            )}

            {/* Selected relationship pills */}
            {selectedRelationships.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedRelationships.map((r) => (
                  <span
                    key={r.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {r.name}
                    <button
                      onClick={() => removeRelationship(r.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tag */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by tag…"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {tagSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {tagSuggestions.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => addTag(t)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            )}

            {/* Selected tag pills */}
            {selectedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTags.map((t) => (
                  <span
                    key={t.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {t.name}
                    <button
                      onClick={() => removeTag(t.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {/* ─── SHELVES TAB ───────────────────────────────────────────────────────── */}
    {activeTab === "shelves" && (
      <>
        {/* Shelf Title typeahead */}
        <div className="mb-2 relative">
          <input
            type="text"
            placeholder="Search shelf title…"
            value={shelfTitleText}
            onChange={(e) => setShelfTitleText(e.target.value)}
            className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
          />
          {shelfTitleSuggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
              {shelfTitleSuggestions.map((s) => (
                <li
                  key={s.id}
                  onClick={() => addShelfTitle(s)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {s.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected shelf title pills */}
        {selectedShelfTitles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedShelfTitles.map((s) => (
              <span
                key={s.id}
                className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
              >
                {s.title}
                <button
                  onClick={() => removeShelfTitle(s.id)}
                  className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Fandom / Relationship / Tag typeaheads for Shelves */}
        <div className="flex flex-col space-y-4 mb-6">
          {/* Shelf Fandom */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter shelf by fandom…"
              value={fandomText}
              onChange={(e) => setFandomText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {fandomSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {fandomSuggestions.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => addShelfFandom(f)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}

            {selectedShelfFandoms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedShelfFandoms.map((f) => (
                  <span
                    key={f.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {f.name}
                    <button
                      onClick={() => removeShelfFandom(f.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Shelf Relationship */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter shelf by relationship…"
              value={relationshipText}
              onChange={(e) => setRelationshipText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {relationshipSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {relationshipSuggestions.map((r) => (
                  <li
                    key={r.id}
                    onClick={() => addShelfRelationship(r)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {r.name}
                  </li>
                ))}
              </ul>
            )}

            {selectedShelfRelationships.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedShelfRelationships.map((r) => (
                  <span
                    key={r.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {r.name}
                    <button
                      onClick={() => removeShelfRelationship(r.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Shelf Tag */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter shelf by tag…"
              value={tagText}
              onChange={(e) => setTagText(e.target.value)}
              className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
            />
            {tagSuggestions.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
                {tagSuggestions.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => addShelfTag(t)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {t.name}
                  </li>
                ))}
              </ul>
            )}

            {selectedShelfTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedShelfTags.map((t) => (
                  <span
                    key={t.id}
                    className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
                  >
                    {t.name}
                    <button
                      onClick={() => removeShelfTag(t.id)}
                      className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )}

    {/* ─── USERS TAB ─────────────────────────────────────────────────────────── */}
    {activeTab === "users" && (
      <>
        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search username…"
            value={usernameText}
            onChange={(e) => setUsernameText(e.target.value)}
            className="w-full border border-[#202d26] rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#202d26]"
          />
          {userSuggestions.length > 0 && (
            <ul className="absolute z-20 w-full bg-white border border-gray-300 rounded shadow-sm max-h-40 overflow-y-auto mt-1 text-sm">
              {userSuggestions.map((u) => (
                <li
                  key={u.id}
                  onClick={() => addUser(u)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {u.username}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedUsers.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <span
                key={u.id}
                className="flex items-center bg-[#202d26] text-[#d3b7a4] px-2 py-1 rounded-full text-sm"
              >
                {u.username}
                <button
                  onClick={() => removeUser(u.id)}
                  className="ml-1 text-xs text-[#d3b7a4] hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </>
    )}
  </div>

  {/* ─── RESULTS LIST ───────────────────────────────────────────────────────── */}
  <div className="max-w-3xl mx-auto">
    {loading && page === 1 ? (
      <p>Loading…</p>
    ) : results.length === 0 && page === 1 ? (
      <p>
        {activeTab === "fics"
          ? "No fics match your criteria."
          : activeTab === "shelves"
          ? "No shelves match your criteria."
          : "No users match that username."}
      </p>
    ) : (
      <>
        {results.map((item) => {
          if (activeTab === "fics") {
            return (
              <div
                key={item.id}
                className="mb-6 p-4 bg-white rounded shadow hover:shadow-md transition"
              >
                <h3
                  className="text-xl font-semibold cursor-pointer text-[#202d26]"
                  onClick={() => navigate(`/fic/${item.id}`)}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">by {item.author}</p>
                <p className="text-sm mb-2 line-clamp-3">{item.summary}</p>
                <div className="flex text-xs text-gray-500">
                  <span className="mr-4">Hits: {item.hits}</span>
                  <span className="mr-4">Kudos: {item.kudos}</span>
                  <span>
                    Updated: {new Date(item.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          } else if (activeTab === "shelves") {
            return (
              <div
                key={item.id}
                className="mb-6 p-4 bg-white rounded shadow hover:shadow-md transition"
              >
                <h3
                  className="text-xl font-semibold cursor-pointer text-[#202d26]"
                  onClick={() => navigate(`/bookshelf/${item.id}`)}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Created by user ID {item.user_id}
                </p>
              </div>
            );
          } else if (activeTab === "users") {
            return (
              <div
                key={item.id}
                className="mb-6 p-4 bg-white rounded shadow hover:shadow-md transition"
              >
                <h3
                  className="text-xl font-semibold cursor-pointer text-[#202d26]"
                  onClick={() => navigate(`/user/${item.username}`)}
                >
                  {item.username}
                </h3>
                <p className="text-sm text-gray-600">{item.display_name}</p>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {item.bio}
                </p>
              </div>
            );
          }
          return null;
        })}

        {/* ─── “Load More” BUTTON FOR FICS & SHELVES ───────────────────────── */}
        {(activeTab === "fics" || activeTab === "shelves") && hasMore && !loading && (
          <div className="text-center my-4">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="bg-[#202d26] text-[#d3b7a4] px-4 py-2 rounded"
            >
              Load More
            </button>
          </div>
        )}

        {/* “Loading more…” when page > 1 */}
        {loading && page > 1 && (
          <p className="text-center mb-4">Loading more…</p>
        )}
      </>
    )}
  </div>
  </div>
);

}
