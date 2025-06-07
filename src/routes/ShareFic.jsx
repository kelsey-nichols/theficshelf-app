import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";

const ShareFicPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fic } = location.state || {};
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!fic) {
    return <p>Missing fic data. Return to previous page.</p>;
  }

  const handlePost = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.id) {
      console.error("User not authenticated");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("posts").insert([
      {
        user_id: userData.user.id,
        fic_id: fic.id,
        text: content.trim(),
      },
    ]);

    if (error) {
      console.error("Error creating post:", error.message);
    } else {
      navigate("/feed");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#d3b7a4] flex justify-center items-start py-10 px-4">
      <form
        onSubmit={handlePost}
        className="max-w-2xl w-full bg-[#2d261e] text-[#d3b7a4] shadow-md space-y-6 font-serif rounded-xl p-8"
      >
        <h2 className="text-3xl font-semibold text-[#d3b7a4] mb-4">
          share fic
        </h2>

        {/* Fic Info */}
        <div className="bg-[#946241] p-4 rounded-lg">
          <h3 className="text-xl font-semibold">{fic.title}</h3>
          <p className="italic text-sm text-[#202d26] mb-2">
            by {fic.author || "Unknown"}
          </p>
          <p className="text-sm text-[#202d26] whitespace-pre-wrap">
            {fic.summary || "(No summary provided)"}
          </p>
        </div>

        {/* Thoughts */}
        <div>
          <label className="block mb-2 font-medium text-[#d3b7a4]">
            create post
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Add your thoughts here."
            className="w-full bg-[#d3b7a4] border-2 border-[#444] rounded-lg px-3 py-2 text-sm text-[#202d26] resize-y focus:outline-none focus:ring-2 focus:ring-[#886146]"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-center mt-6">
          <button
            type="submit"
            disabled={submitting || content.trim() === ""}
            className={`px-6 py-2 rounded-md text-[#202d26] font-semibold ${
              submitting || content.trim() === ""
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#d3b7a4] hover:bg-[#6f4b34]"
            }`}
          >
            {submitting ? "Posting..." : "SHARE TO FEED"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShareFicPage;