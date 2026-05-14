import React from "react";
import { useAmi } from "../../../context/AmiContext";
import { fetchLeaderboard } from "../../../services/amiApi";
import useAmiSessions from "../../../hooks/useAmiSessions";

const DEBATE_TIME_OPTIONS = {
  "2m": { label: "2 phút", seconds: 120, bonus: 150 },
  "3m": { label: "3 phút", seconds: 180, bonus: 100 },
  "5m": { label: "5 phút", seconds: 300, bonus: 50 },
  unlimited: { label: "Không giới hạn", seconds: 0, bonus: 0 },
};

const AMI_STYLE_OPTIONS = [
  { key: "gentle",  label: "Dịu dàng",         icon: "😇", desc: "Ấm áp, kiên nhẫn, giải thích từng bước" },
  { key: "playful", label: "Ngổ ngáo",          icon: "😎", desc: "Cộc lốc, cà khịa nhẹ, đúng chất" },
  { key: "strict",  label: "Nóng tính áp lực",  icon: "🔥", desc: "Khó tính, ép lập luận, tạo pressure" },
  { key: "ceo",     label: "Tổng tài bá đạo",   icon: "👑", desc: "Lạnh lùng command, vibe đại tiểu thư" },
];

function SubjectAvatar({ avatar }) {
  if (!avatar) return "📚";
  if (avatar.startsWith("data:") || avatar.startsWith("http") || avatar.startsWith("/")) {
    return <img src={avatar} alt="" width="22" height="22" style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />;
  }
  if (avatar.length > 50) {
    return <img src={`data:image/png;base64,${avatar}`} alt="" width="22" height="22" style={{ borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />;
  }
  return avatar;
}

// ── Feature pages — each is the content for a sidebar feature ──

function FeatureSubjects() {
  const { chatbots, selectedSource, selectSubject, backToExtended } = useAmi();
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">Sau khi chọn môn, Ami sẽ trả lời theo ngữ cảnh riêng của môn đó.</p>
      </div>
      <div className="feature-list">
        {chatbots.length === 0 ? <p className="panel-empty">Đang tải danh sách môn...</p>
        : chatbots.map((bot) => (
          <button key={bot.id || bot.source}
            className={`subject-card ${bot.source === selectedSource ? "is-active" : ""}`}
            onClick={() => { selectSubject(bot); backToExtended(); }}>
            <span className="subject-icon"><SubjectAvatar avatar={bot.avatar} /></span>
            <span className="subject-info"><span className="subject-name">{bot.name}</span><span className="subject-code">{bot.source}</span></span>
            {bot.source === selectedSource && (
              <span className="subject-active-badge">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" width="11" height="11"><path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Đang chọn
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeatureHistory() {
  const { sessions, loadSession } = useAmiSessions();
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">Xem lại các cuộc trò chuyện trước đây với Ami.</p>
      </div>
      <div className="feature-list">
        {sessions.length === 0 ? (
          <p className="panel-empty">Chưa có lịch sử chat nào.</p>
        ) : (
          sessions.map((s) => {
            const id = s.session_id || s.id;
            const title = s.session_title || s.first_message || s.last_message || `Phiên ${String(id).slice(0, 8)}`;
            const meta  = s.last_timestamp ? new Date(s.last_timestamp).toLocaleDateString("vi-VN") : "";
            return (
              <button key={id} className="history-item history-item-btn" onClick={() => loadSession(id)}>
                <span className="history-item-title">{title}</span>
                {meta && <span className="history-item-meta">{meta}</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function FeatureDebate() {
  const { selectedSource, openFeature, debateActive, debateTimeOption, setDebateTimeOption } = useAmi();
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">Ami sẽ đưa thử thách, phản biện lại câu trả lời của bạn và chấm điểm cuối cùng.</p>
      </div>
      <div className="expr-group">
        <p className="expr-label">Thời gian mỗi lượt</p>
        <div className="option-grid">
          {Object.entries(DEBATE_TIME_OPTIONS).map(([key, opt]) => (
            <button
              key={key}
              className={`option-button${debateTimeOption === key ? " is-active" : ""}`}
              onClick={() => setDebateTimeOption(key)}
            >
              {opt.label}
              {opt.bonus > 0 && <span style={{ fontSize: 10, opacity: 0.6, display: "block" }}>+{opt.bonus} điểm thưởng</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="feature-actions">
        {!selectedSource ? (
          <button className="hero-btn hero-btn--green" onClick={() => openFeature("subjects")}>Chọn môn học trước</button>
        ) : (
          <button className="hero-btn hero-btn--warm" onClick={() => window.dispatchEvent(new CustomEvent("ami-start-debate"))}>
            {debateActive ? "Tiếp tục thử thách" : "Bắt đầu thử thách"}
          </button>
        )}
        <button className="hero-btn hero-btn--ghost" onClick={() => openFeature("leaderboard")}>Xem bảng xếp hạng</button>
        {debateActive && (
          <button className="hero-btn hero-btn--ghost" onClick={() => window.dispatchEvent(new CustomEvent("ami-cancel-debate"))}>Dừng phiên hiện tại</button>
        )}
      </div>
    </div>
  );
}

function FeatureLeaderboard() {
  const { selectedSource } = useAmi();
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!selectedSource) return;
    setLoading(true);
    fetchLeaderboard(selectedSource).then((d) => setLeaderboard(d.leaderboard || [])).catch(() => setLeaderboard([])).finally(() => setLoading(false));
  }, [selectedSource]);
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">{selectedSource ? "Top người học có điểm thử thách cao nhất." : "Chọn môn học để xem bảng xếp hạng."}</p>
      </div>
      <div className="feature-list">
        {!selectedSource ? <p className="panel-empty">Vui lòng chọn môn học.</p>
        : loading ? <p className="panel-empty">Đang tải...</p>
        : leaderboard.length === 0 ? <p className="panel-empty">Chưa có ai ghi tên.</p>
        : leaderboard.map((item, idx) => {
            const icon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`;
            const meta = [`${item.attempt_count || 1} lượt`, item.bonus_points ? `+${item.bonus_points} bonus` : "", item.time_label || ""].filter(Boolean).join(" · ");
            return <div key={idx} className={`leaderboard-item ${idx < 3 ? "is-podium" : ""}`}><div className="leaderboard-rank">{icon}</div><div className="leaderboard-meta"><strong>{item.user_name || "Ẩn danh"}</strong><span>{meta}</span></div><div className="leaderboard-score">{item.score || 0} đ</div></div>;
          })}
      </div>
    </div>
  );
}

const COOLDOWNS = { costume: 500, motion: 3500, expression: 500 };

function FeatureExpressions() {
  const { model, costumeControllerRef } = useAmi();
  const [cooling, setCooling] = React.useState(null);
  const timer = React.useRef(null);

  const trigger = (category, key, action) => {
    if (cooling) return;
    if (category === 'costume') {
      // Drive costume via the per-frame parameter controller — immune to expression/motion overrides
      costumeControllerRef?.current?.setCostume(key);
    } else {
      action();
    }
    const duration = COOLDOWNS[category];
    setCooling({ key, duration });
    timer.current = setTimeout(() => setCooling(null), duration);
  };

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const btn = (category, key, label, action) => {
    const isCooling = cooling?.key === key;
    return (
      <button
        key={key}
        className={`option-button expr-btn${isCooling ? " is-cooling" : ""}${cooling && !isCooling ? " is-locked" : ""}`}
        style={isCooling ? { "--cooldown": `${cooling.duration}ms` } : {}}
        onClick={() => trigger(category, key, action)}
        disabled={!!cooling && !isCooling}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="feature-page">
      <div className="expr-group">
        <p className="expr-label">Trang phục</p>
        <div className="option-grid">
          {[{ l: "Bỏ kính", e: "Glasses Toggle" }, { l: "Bỏ áo khoác", e: "Jacket Toggle" }, { l: "Bỏ áo khoác + kính", e: "No_Jacket_Glasses" }, { l: "Nguyên bản", e: "Default" }]
            .map(({ l, e }) => btn("costume", e, l, () => model.setExpression(e)))}
        </div>
      </div>
      <div className="expr-group">
        <p className="expr-label">Hành động</p>
        <div className="option-grid">
          {[{ l: "Thả tim", m: "Heart" }, { l: "Chào #1", m: "Checkin1" }, { l: "Chào #2", m: "Checkin2" }, { l: "Tạo dáng", m: "Checkin3" }]
            .map(({ l, m }) => btn("motion", m, l, () => model.playMotion(m)))}
        </div>
      </div>
      <div className="expr-group">
        <p className="expr-label">Biểu cảm</p>
        <div className="option-grid">
          {[{ l: "Vui", e: "Happy" }, { l: "Buồn", e: "Sad" }, { l: "E thẹn", e: "Blush" }, { l: "Hào hứng", e: "Excited" }, { l: "Giận", e: "Angry" }, { l: "Chống nạnh", e: "Chong_Nanh" }]
            .map(({ l, e }) => btn("expression", e, l, () => model.setExpression(e)))}
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"rgba(255,255,255,0.35)" }}>{label}</span>
      <span style={{ fontSize:13, color:"rgba(255,255,255,0.88)", wordBreak:"break-all" }}>{value}</span>
    </div>
  );
}

function FeatureProfile() {
  const { profile } = useAmi();
  const roleMap = { admin: "Quản trị viên", teacher: "Giảng viên", user: "Học viên" };
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">{profile ? "Thông tin tài khoản của bạn." : "Đang tải..."}</p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <ProfileField label="Họ và tên"     value={profile?.full_name} />
        <ProfileField label="Tên đăng nhập" value={profile?.username ? `@${profile.username}` : ""} />
        <ProfileField label="Email"         value={profile?.email} />
        {profile?.role && (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"rgba(255,255,255,0.35)" }}>Vai trò</span>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:999, background:"rgba(255,255,255,0.08)", fontSize:12, width:"fit-content", color:"#fff" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
              {roleMap[profile.role] || profile.role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureSettings() {
  const { amiStyle, setAmiStyle } = useAmi();
  const handleSelect = (key) => {
    setAmiStyle(key);
    localStorage.setItem("ami-style-mode", key);
  };
  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">Chọn phong cách Ami khi đồng hành cùng bạn. Nội dung học vẫn bám môn, chỉ thay đổi giọng điệu.</p>
      </div>
      <div className="expr-group">
        <div className="option-grid ami-style-grid">
          {AMI_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`option-button ami-style-option${amiStyle === opt.key ? " is-active" : ""}`}
              onClick={() => handleSelect(opt.key)}
            >
              <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>{opt.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 12 }}>{opt.label}</span>
              <span style={{ fontSize: 10, opacity: 0.65, display: "block", marginTop: 2 }}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATURE_PAGES = { subjects: FeatureSubjects, history: FeatureHistory, debate: FeatureDebate, leaderboard: FeatureLeaderboard, expressions: FeatureExpressions, profile: FeatureProfile, settings: FeatureSettings };

export default function DrawerPage({ feature }) {
  const Active = FEATURE_PAGES[feature];
  if (!Active) return <p className="panel-empty">Chọn một mục từ menu</p>;
  return <Active />;
}
