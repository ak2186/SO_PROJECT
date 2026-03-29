import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export const Layout = () => {
  return (
    <>
      <Navbar />
      <div
        style={{
          padding: "24px",
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--text)",
          background: "var(--bg-3)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Outlet />
      </div>
    </>
  );
};
