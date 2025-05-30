import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { ChevronLeft } from "lucide-react";  // Import the icon

const ShareFicPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fic } = location.state || {};
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!fic) {
    return <p>Missing fic data. Return to previous page.</p>;
  }

  const handlePost = async () => {
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
    <div style={{ padding: "1.5rem", color: "#d5baa9", fontFamily: "serif" }}>
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          background: "none",
          border: "none",
          color: "#d5baa9",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: 0,
          fontSize: "1rem",
          fontWeight: "bold",
        }}
        aria-label="Go back"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <h2>Share Fic</h2>

      <div style={{ backgroundColor: "#202d26", padding: "1rem", borderRadius: "6px", marginBottom: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>{fic.title}</h3>
        <p style={{ fontStyle: "italic", marginBottom: "0.5rem" }}>
          by {fic.author || "Unknown"}
        </p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {fic.summary || "(No summary provided)"}
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Add your thoughts..."
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "4px",
          fontFamily: "inherit",
          resize: "vertical",
          backgroundColor: "#2f3f36",
          color: "#d5baa9",
          border: "1px solid #444",
          marginBottom: "1rem",
        }}
      />

      <button
        onClick={handlePost}
        disabled={submitting || content.trim() === ""}
        style={{
          backgroundColor: "#3d9970",
          color: "#fff",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "4px",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Posting..." : "Share to Feed"}
      </button>
    </div>
  );
};

export default ShareFicPage;
