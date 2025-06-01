import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className="absolute top-4 left-4 p-2"
    >
      <ChevronLeft size={32} color="#202d26" />
    </button>
  );
};

export default BackButton;