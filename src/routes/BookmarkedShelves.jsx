import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { Lock } from "lucide-react";

const BookmarkedShelves = () => {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [bookmarkedShelves, setBookmarkedShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkedShelves = async () => {
      if (!session?.user?.id) return;

      /*
       * Query bookmarked_shelves joined with shelves to get shelf info
       * only for shelves bookmarked by the current user.
       */
      const { data, error } = await supabase
        .from("bookmarked_shelves")
        .select(`
          shelf: shelves (
            id,
            user_id,
            title,
            is_private,
            color,
            sort_order,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false }); // newest bookmarks first

      if (error) {
        console.error("Error fetching bookmarked shelves:", error);
        setBookmarkedShelves([]);
      } else {
        // Flatten the result to just an array of shelves (filter out nulls if shelf deleted)
        const shelves = data
          .map((item) => item.shelf)
          .filter((shelf) => shelf !== null);
        setBookmarkedShelves(shelves);
      }
      setLoading(false);
    };

    fetchBookmarkedShelves();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-8 bg-[#d3b7a4] flex items-center justify-center">
        <p>Loading bookmarked shelves...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 bg-[#d3b7a4]">
      <div className="max-w-md mx-auto mb-6">
        <h1 className="text-4xl font-bold text-[#202d26]">bookmarked shelves</h1>
      </div>

      {bookmarkedShelves.length === 0 ? (
        <p className="max-w-md mx-auto text-center text-gray-700">
          You have no bookmarked shelves yet.
        </p>
      ) : (
        <div className="flex flex-col space-y-3 max-w-md mx-auto">
          {bookmarkedShelves.map((shelf) => (
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

export default BookmarkedShelves;
