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
import { Lock, GripVertical, MoreVertical, Plus, Trash2 } from "lucide-react";

const COLORS = {
  moss: "#a7b89e",
  olive: "#4a5c46",
  sky: "#acc5c7",
  storm: "#6d8b8d",
  winkle: "#95a9c4",
  cocoa: "#442d1d",
  caramel: "#84592c",
  "spiced wine": "#733015",
  pumpkin: "#956241",
  "dusty rose": "#995643",
  grey: "#464c48",
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

const SortableShelf = ({ shelf, isPrivate, editing, onColorChange, onDelete }) => {
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
  const dropdownRef = useRef(null);
  useOutsideClick(dropdownRef, () => setDropdownOpen(false));

  // Check if shelf is "Archive"
  const isArchive = shelf.title === "Archive";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-xl shadow-md w-full flex items-center justify-between"
    >
      <div className="flex items-center space-x-2">
        {editing && (
          <div
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            className="cursor-grab touch-none px-2"
            aria-label={`Drag handle for shelf ${shelf.title}`}
          >
            <GripVertical size={20} className="text-gray-600" />
          </div>
        )}
        <h3 className="text-xl font-semibold">{shelf.title}</h3>
        {isPrivate && <Lock size={18} className="text-gray-600" />}
      </div>

      <div className="flex items-center space-x-2">
        {editing && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label={`Choose color for shelf ${shelf.title}`}
              className="p-1 rounded hover:bg-gray-200"
            >
              <MoreVertical size={20} />
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
            aria-label={
              isArchive
                ? `Delete disabled for Archive shelf`
                : `Delete shelf ${shelf.title}`
            }
            className={`p-1 rounded hover:bg-red-100 ${
              isArchive ? "opacity-50 cursor-not-allowed" : "hover:text-red-600"
            }`}
          >
            <Trash2 size={20} />
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
      className="p-4 rounded-xl shadow-md w-full flex items-center justify-center cursor-pointer border border-dashed border-gray-400 hover:bg-gray-100 transition max-w-md mx-auto mb-3"
      style={{ height: "72px" }} // roughly same height as shelves
      aria-label="Create new shelf"
    >
      <Plus size={32} className="text-gray-500" />
    </div>
  );
};

const Bookshelf = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

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

    // Update DB order in parallel
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

  const handleDelete = async (shelfId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this shelf and all the fics stored within it? This action cannot be undone."
  );
  if (!confirmed) return;

  // Remove from local state immediately
  setShelves((prev) => prev.filter((shelf) => shelf.id !== shelfId));

  // Delete from DB
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
    <div className="min-h-screen px-6 py-8 bg-[#d3b7a4]">
      <div className="flex justify-between items-center mb-6 max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-[#202d26]">Your Bookshelf</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="text-sm text-[#202d26] underline hover:text-[#886146]"
          aria-pressed={editing}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      <h2 className="text-lg text-[#886146] mb-4 max-w-md mx-auto">
        Welcome, {session?.user?.email}
      </h2>

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
  <h3 className="text-xl font-semibold">{shelf.title}</h3>
  {shelf.is_private && <Lock size={18} className="text-gray-600" />}
</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
