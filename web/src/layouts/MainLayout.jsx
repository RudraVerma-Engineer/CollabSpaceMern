import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import Avatar from "../components/common/Avatar.jsx";
import Icon from "../components/common/Icon.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { useTheme } from "../hooks/useTheme.js";

const NAV_ITEMS = [
  { to: "/feed", label: "Feed", icon: "feed" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/people", label: "People", icon: "people" },
  { to: "/messages", label: "Messages", icon: "messages", badge: "messages" },
  { to: "/requests", label: "Requests", icon: "requests", secondary: true },
  { to: "/notifications", label: "Alerts", icon: "bell", badge: "notifications" },
  { to: "/profile", label: "Profile", icon: "profile" },
];

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount, unreadMessageCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [searchText, setSearchText] = useState("");

  const badgeCounts = {
    messages: unreadMessageCount,
    // message alerts already show on the Messages item
    notifications: Math.max(0, unreadCount - unreadMessageCount),
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchText.trim();

    if (query.length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // The chat screen uses the full width/height of the content area.
  const isChatPage = pathname.startsWith("/messages");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-logo">
          Collab<span>Space</span>
        </div>

        <nav className="app-nav" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, icon, badge, secondary }) => (
            <NavLink
              key={to}
              to={to}
              className={`nav-link ${secondary ? "nav-link-secondary" : ""}`}
            >
              <Icon name={icon} />
              {label}
              {badge && badgeCounts[badge] > 0 && (
                <span className="nav-badge">{badgeCounts[badge]}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <form className="header-search" onSubmit={handleSearch} role="search">
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search people, projects and posts"
              aria-label="Search"
            />
          </form>

          <div className="app-user">
            <button type="button" className="btn btn-sm" onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
              {theme === "dark" ? "☀" : "🌙"}
            </button>
            <Avatar user={user} size={32} />
            <span className="app-user-name">{user?.name}</span>
            <button type="button" className="btn btn-sm" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <main className={`app-content ${isChatPage ? "app-content-flush" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
