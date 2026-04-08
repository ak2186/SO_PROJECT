import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

export const Layout = () => {
  return (
    <>
      {/* Desktop navbar — hidden on mobile via CSS */}
      <div className="desktop-nav-hide">
        <Navbar />
      </div>

      {/* Mobile navbar — hidden on desktop via CSS */}
      <div className="mobile-nav-container">
        <MobileNav />
      </div>

      <div
        className="mobile-layout-wrapper"
        style={{
          padding: "0",
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--text)",
          background: "var(--bg)",
          minHeight: "calc(100vh - 64px)",
          width: "100%",
        }}
      >
        <Outlet />
      </div>
    </>
  );
};
