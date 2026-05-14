import React, { useEffect } from "react";
import { useAmi } from "../../../context/AmiContext";
import DrawerPage from "./Drawer";

const FEATURE_META = {
  subjects:    { label: "Học cùng Ami" },
  history:     { label: "Lịch sử" },
  debate:      { label: "Thử thách Ami" },
  leaderboard: { label: "Bảng vàng" },
  expressions: { label: "Biểu cảm" },
  profile:     { label: "Tài khoản" },
  settings:    { label: "Cài đặt" },
};

const TOP_ITEMS = [
  { action: "subjects",    label: "Môn học",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { action: "history",     label: "Lịch sử",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 7v5l3 2"/><path d="M12 3a9 9 0 1 1-9 9"/><path d="M5 4v4H1"/></svg> },
  { action: "debate",      label: "Thử thách", svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M8 21h8M12 17v4M7 4h10c1.7 0 3 1.3 3 3v2c0 2.2-1.8 4-4 4h-8c-2.2 0-4-1.8-4-4V7c0-1.7 1.3-3 3-3Z"/></svg> },
  { action: "leaderboard", label: "Xếp hạng",  svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v3a5 5 0 0 1-10 0V4Z"/><path d="M5 6H4a2 2 0 0 0 0 4h2"/><path d="M19 6h1a2 2 0 1 1 0 4h-2"/></svg> },
];

const BOTTOM_ITEMS = [
  { action: "expressions", label: "Biểu cảm",  svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01M9 14c.8 1 1.8 1.5 3 1.5s2.2-.5 3-1.5"/></svg> },
  { action: "profile",     label: "Tài khoản", svg: null, isAvatar: true },
  { action: "settings",    label: "Cài đặt",   svg: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6Z"/></svg> },
];

function toVietnameseOrder(name) {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return [...parts.slice(1), parts[0]].join(" ");
}

function getInitials(fullName, username) {
  const name = toVietnameseOrder(fullName || username || "?").trim();
  const parts = name.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const { sidebarState, activeFeature, toggleSidebar, openFeature, backToExtended, newConversation, profile } = useAmi();
  const initials = getInitials(profile?.full_name, profile?.username);
  const isCollapsed = sidebarState === "collapsed";
  const isFeature   = sidebarState === "feature";
  const isPanelOpen = !isCollapsed;

  useEffect(() => {
    const onOpenFeature = (e) => openFeature(e.detail);
    const onBack = () => backToExtended();
    window.addEventListener("ami-open-feature", onOpenFeature);
    window.addEventListener("ami-back-extended", onBack);
    return () => {
      window.removeEventListener("ami-open-feature", onOpenFeature);
      window.removeEventListener("ami-back-extended", onBack);
    };
  }, [openFeature, backToExtended]);

  return (
    <>
      {isPanelOpen && (
        <div className="ami-sidebar-backdrop" onClick={toggleSidebar} />
      )}
      {/* ── Icon strip — always 64px, layout NEVER changes ── */}
      <aside className="ami-sidebar-strip">
        <div className="strip-toggle">
          <button className="strip-icon-btn" onClick={toggleSidebar} title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <g className={`toggle-chevron${!isCollapsed ? " is-flipped" : ""}`}>
                <path d="M10 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
        </div>

        <div className="sidebar-divider" />

        <div className="strip-menu">
          {TOP_ITEMS.map((item) => (
            <button
              key={item.action}
              className={`strip-icon-btn${activeFeature === item.action && isFeature ? " is-active" : ""}`}
              onClick={() => openFeature(item.action)}
              title={item.label}
            >
              {item.svg}
            </button>
          ))}
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-divider" />

        <div className="strip-menu strip-menu--bottom">
          {BOTTOM_ITEMS.map((item) => (
            <button
              key={item.action}
              className={`strip-icon-btn${activeFeature === item.action && isFeature ? " is-active" : ""}`}
              onClick={() => openFeature(item.action)}
              title={item.label}
            >
              {item.isAvatar
                ? <span className="sidebar-avatar">{initials || "?"}</span>
                : item.svg}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Overlay panel — fixed size, slides over stage ── */}
      <div className={`ami-sidebar-panel${isPanelOpen ? " is-open" : ""}${isFeature ? " is-feature" : ""}`}>
        <div key={isFeature ? activeFeature : "menu"} className="panel-inner">
        {isFeature ? (
          <>
            <div className="panel-feature-header">
              <span className={`panel-kicker${FEATURE_META[activeFeature]?.warm ? " panel-kicker--warm" : ""}`}>
                {FEATURE_META[activeFeature]?.label || activeFeature}
              </span>
              <button className="panel-back-btn" onClick={backToExtended}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="m15 18-6-6 6-6" /></svg>
                <span>Quay lại</span>
              </button>
            </div>
            <div className="sidebar-divider" />
            <div className="sidebar-feature-content">
              <DrawerPage feature={activeFeature} />
            </div>
          </>
        ) : (
          <>
            <div className="panel-header">
              <span className="panel-section-label">Menu</span>
              <button className="panel-back-btn panel-new-chat-btn" onClick={newConversation}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="3.2" width="12" height="12"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
                Chat mới
              </button>
            </div>
            <div className="sidebar-divider" />
            <div className="panel-menu">
              {TOP_ITEMS.map((item) => (
                <button
                  key={item.action}
                  className="panel-label-btn"
                  onClick={() => openFeature(item.action)}
                >
                  {FEATURE_META[item.action]?.label || item.label}
                </button>
              ))}
            </div>
            <div className="sidebar-spacer" />
            <div className="sidebar-divider" />
            <div className="panel-menu panel-menu--bottom">
              {BOTTOM_ITEMS.map((item) => (
                <button key={item.action} className="panel-label-btn" onClick={() => openFeature(item.action)}>
                  {FEATURE_META[item.action]?.label || item.label}
                </button>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </>
  );
}
