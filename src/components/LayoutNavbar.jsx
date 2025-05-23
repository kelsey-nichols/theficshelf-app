import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export default function LayoutWithNavbar() {
  return (
    <div className="min-h-screen pb-16">
      <Outlet />
      <Navbar />
    </div>
  );
}