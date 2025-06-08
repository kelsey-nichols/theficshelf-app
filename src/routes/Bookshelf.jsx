import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Lock,
  GripVertical,
  Ellipsis,
  Plus,
  Trash2,
  MoreVertical,
} from "lucide-react";

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

const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, callback]);
};

const SortableShelf = ({
  shelf,
  isPrivate,
  editing,
  onColorChange,
  onDelete,
  onRename,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: shelf.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: shelf.color || "#fff",
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(shelf.title);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useOutsideClick(dropdownRef, () => setDropdownOpen(false));

  const isArchive = shelf.title === "Archive";

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renaming]);

  const handleRenameSubmit = () => {
    if (newTitle.trim() && newTitle !== shelf.title) {
      onRename(shelf.id, newTitle.trim());
    }
    setRenaming(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-xl shadow-md w-full flex items-center justify-between"
    >
      {/* LEFT SIDE: Drag handle, title/rename, and lock icon */}
      <div className="flex items-center space-x-2">
        {editing && (
          <div
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            className="cursor-grab touch-none px-2"
            aria-label="Drag shelf"
          >
            {/* Drag handle icon in edit mode */}
            <GripVertical size={20} className="text-[#d3b7a4]" />
          </div>
        )}

        {editing && !isArchive ? (
          renaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setRenaming(false);
                  setNewTitle(shelf.title);
                }
              }}
              className="text-xl font-semibold bg-white border rounded px-2 py-1 w-40"
            />
          ) : (
            <h3
              className="text-xl font-semibold cursor-pointer underline decoration-dotted"
              onClick={() => setRenaming(true)}
              title="Click to rename"
            >
              {shelf.title}
            </h3>
          )
        ) : (
          // NON-EDIT MODE: title is #d3b7a4
          <h3 className="text-xl font-semibold text-[#d3b7a4]">
            {shelf.title}
          </h3>
        )}

        {isPrivate && (
          // Lock icon: gray when editing, #d3b7a4 otherwise
          <Lock
            size={18}
            className={editing ? "text-gray-600" : "text-[#d3b7a4]"}
          />
        )}
      </div>

      {/* RIGHT SIDE: Color picker dropdown + delete button */}
      <div className="flex items-center space-x-2">
        {editing && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="p-1 rounded hover:bg-gray-200"
              aria-label="Open color menu"
            >
              {/* Ellipsis icon colored #d3b7a4 */}
              <MoreVertical size={20} className="text-[#d3b7a4]" />
            </button>

            {dropdownOpen && (
              <ul className="absolute right-0 top-full mt-2 w-40 bg-white rounded shadow-lg z-10 border border-gray-200 max-h-60 overflow-auto">
                {Object.entries(COLORS).map(([name, hex]) => (
                  <li key={name}>
                    <button
                      onClick={() => {
                        onColorChange(shelf.id, hex);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100"
                    >
                      <span
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="capitalize">{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {editing && (
          <button
            onClick={() => !isArchive && onDelete(shelf.id)}
            disabled={isArchive}
            className={`p-1 rounded hover:bg-red-100 ${
              isArchive ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Delete shelf"
          >
            <Trash2 size={20} className="text-[#d3b7a4]" />
          </button>
        )}
      </div>
    </div>
  );
  };

const NewShelfBox = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className="p-4 rounded-xl shadow-md w-full flex items-center justify-center cursor-pointer border border-dashed border-[#202d26] hover:bg-[#816454] transition max-w-md mx-auto mb-3"
      style={{ height: "72px" }}
      aria-label="Create new shelf"
    >
      <Plus size={32} className="text-[#202d26]" />
    </div>
  );
};

const Bookshelf = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // State to toggle the top‐right ellipsis menu
  const [menuOpen, setMenuOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchShelves = async () => {
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from("shelves")
        .select("*")
        .eq("user_id", session.user.id)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching shelves:", error);
      } else {
        setShelves(data);
      }

      setLoading(false);
    };

    fetchShelves();
  }, [session]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = shelves.findIndex((s) => s.id === active.id);
    const newIndex = shelves.findIndex((s) => s.id === over.id);
    const newOrder = arrayMove(shelves, oldIndex, newIndex);
    setShelves(newOrder);

    // Update DB sort_order
    await Promise.all(
      newOrder.map((shelf, index) =>
        supabase.from("shelves").update({ sort_order: index }).eq("id", shelf.id)
      )
    );
  };

  const handleColorChange = async (shelfId, newColor) => {
    setShelves((prev) =>
      prev.map((shelf) =>
        shelf.id === shelfId ? { ...shelf, color: newColor } : shelf
      )
    );

    const { error } = await supabase
      .from("shelves")
      .update({ color: newColor })
      .eq("id", shelfId);

    if (error) {
      console.error("Failed to update shelf color:", error);
    }
  };

  const handleRename = async (shelfId, newTitle) => {
    setShelves((prev) =>
      prev.map((shelf) =>
        shelf.id === shelfId ? { ...shelf, title: newTitle } : shelf
      )
    );

    const { error } = await supabase
      .from("shelves")
      .update({ title: newTitle })
      .eq("id", shelfId);

    if (error) {
      console.error("Failed to rename shelf:", error);
    }
  };

  const handleDelete = async (shelfId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this shelf and all the fics stored within it? This action cannot be undone."
    );
    if (!confirmed) return;

    setShelves((prev) => prev.filter((shelf) => shelf.id !== shelfId));

    const { error } = await supabase.from("shelves").delete().eq("id", shelfId);
    if (error) {
      console.error("Failed to delete shelf:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8 bg-[#d3b7a4] flex items-center justify-center">
        <p className="max-w-md mx-auto">Loading shelves...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 bg-[#d3b7a4] font-serif">
      <div className="flex justify-between items-center mb-6 max-w-md mx-auto">
        <h1 className="text-4xl  font-bold text-[#202d26]">bookshelf</h1>

        {/* Ellipsis menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1 rounded hover:bg-[#d3b7a4]"
            aria-label="Open bookshelf menu"
          >
            <Ellipsis size={24} className="text-[#202d26]" />
          </button>

          {menuOpen && (
            <ul className="absolute right-0 mt-2 w-32 bg-[#202d26] rounded shadow-lg z-10 border border-[#202d26]">
              <li>
                <button
                  onClick={() => {
                    setEditing((prev) => !prev);
                    setMenuOpen(false);
                  }}
                  className="w-full text-center text-[#d3b7a4] px-4 py-2 hover:bg-[#9b5744]"
                >
                  {editing ? "DONE" : "EDIT"}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>

      {editing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={shelves.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col space-y-3 max-w-md mx-auto">
              <NewShelfBox onClick={() => navigate("/create-shelf")} />

              {shelves.map((shelf) => (
                <SortableShelf
                  key={shelf.id}
                  shelf={shelf}
                  isPrivate={shelf.is_private}
                  editing={editing}
                  onColorChange={handleColorChange}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col space-y-3 max-w-md mx-auto">
          {shelves.map((shelf) => (
            <div
              key={shelf.id}
              className="p-4 rounded-xl shadow-md w-full flex items-center justify-between cursor-pointer"
              style={{ backgroundColor: shelf.color || "#fff" }}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/bookshelf/${shelf.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/bookshelf/${shelf.id}`);
                }
              }}
            >
              {/* Shelf title now uses #d3b7a4 */}
              <h3 className="text-xl font-semibold text-[#d3b7a4]">
                {shelf.title}
              </h3>
              {shelf.is_private && (
                <Lock size={18} className="text-[#d3b7a4]" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;

