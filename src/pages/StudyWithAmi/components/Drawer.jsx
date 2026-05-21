import React from "react";
import { useAmi } from "../../../context/AmiContext";
import { fetchLeaderboard } from "../../../services/amiApi";
import { DEBATE_TIME_OPTIONS } from "../../../hooks/useAmiDebate";

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

function fmtSessionTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d)) return "";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;
  return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} - ${time}`;
}

// ── Feature pages — each is the content for a sidebar feature ──

function FeatureSubjects() {
  const { chatbots, selectedSource, selectSubject, backToExtended, returnFeature, setReturnFeature, openFeature } = useAmi();
  const handleSelect = (bot) => {
    selectSubject(bot);
    if (returnFeature) { const rf = returnFeature; setReturnFeature(null); openFeature(rf); }
    else { backToExtended(); }
  };
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
            onClick={() => handleSelect(bot)}>
            <span className="subject-icon"><SubjectAvatar avatar={bot.avatar} /></span>
            <span className="subject-info" style={bot.source === selectedSource ? { paddingRight: 72 } : undefined}><span className="subject-name">{bot.name}</span><span className="subject-code">{bot.source}</span></span>
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
  const {
    sessions, currentSessionId, setCurrentSessionId, backToExtended,
    loadSessions, skipSessions, setSkipSessions, hasMoreSessions, isLoadingHistory, selectedSource, newConversation, openFeature
  } = useAmi();

  if (!selectedSource) {
    return (
      <div className="feature-page">
        <p className="panel-empty" style={{ paddingTop: 0 }}>Bạn cần chọn môn học trước để xem lịch sử.</p>
        <div className="feature-actions">
          <button className="hero-btn hero-btn--green" onClick={() => openFeature("subjects", "history")}>Chọn môn học</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="feature-hero" style={{ paddingBottom: 8 }}>
        <p className="panel-copy">Xem lại các cuộc trò chuyện trước đây với Ami.</p>
        <button className="hero-btn hero-btn--green" style={{ marginTop: 12 }} onClick={() => { newConversation(); backToExtended(); }}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="3.2" width="12" height="12"><path d="M12 5v14M5 12h14" strokeLinecap="round" stroke="currentColor"/></svg>
          Chat mới
        </button>
      </div>
      <div className="feature-list">
        {sessions.length === 0 && !isLoadingHistory ? (
          <p className="panel-empty">Chưa có lịch sử chat nào.</p>
        ) : (
          sessions.map(session => (
            <button
              key={session.session_id}
              className={`subject-card ${currentSessionId === session.session_id ? 'is-active' : ''}`}
              style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '8px 12px', position: 'relative', gap: 2 }}
              onClick={() => {
                setCurrentSessionId(session.session_id);
              }}
            >
              <span className="subject-name" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%', paddingRight: currentSessionId === session.session_id ? 64 : 0, boxSizing: 'border-box' }}>
                {session.first_message || "Đoạn chat mới"}
              </span>
              <span className="subject-code">
                {fmtSessionTime(session.last_timestamp)}
              </span>
              {currentSessionId === session.session_id && (
                <span className="subject-active-badge" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 10 }}>
                  Đang mở
                </span>
              )}
            </button>
          ))
        )}
        
        {isLoadingHistory && sessions.length === 0 && (
          <p className="panel-empty" style={{ fontSize: 12 }}>Đang tải...</p>
        )}

        {hasMoreSessions && sessions.length > 0 && !isLoadingHistory && (
          <button 
            className="hero-btn hero-btn--ghost" 
            style={{ marginTop: 12 }}
            onClick={() => {
              const nextSkip = skipSessions + 30;
              setSkipSessions(nextSkip);
              loadSessions(nextSkip, true);
            }}
          >
            Tải thêm
          </button>
        )}
      </div>
    </div>
  );
}

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

function FeatureDebate() {
  const { selectedSource, openFeature, debateActive, timeLeft, debateFinished, setDebateFinished, debateResult, setMessages, setCurrentSessionId } = useAmi();
  const [timeOpt, setTimeOpt] = React.useState("unlimited");
  const [confirmAction, setConfirmAction] = React.useState(null);
  const isUnlimited = debateActive && timeLeft === null;
  const totalTimeRef = React.useRef(null);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  React.useEffect(() => {
    if (debateActive && timeLeft !== null && totalTimeRef.current === null) totalTimeRef.current = timeLeft;
    if (!debateActive) { totalTimeRef.current = null; setConfirmAction(null); }
  }, [debateActive, timeLeft]);

  if (debateFinished) {
    const ev = debateResult || {};
    const score = ev.score ?? null;
    const rubric = ev.rubric || {};
    const scoreColor = score === null ? "rgba(255,255,255,0.3)" : score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171";
    const scoreLabel = score === null ? "Không có dữ liệu" : score >= 80 ? "Xuất sắc" : score >= 60 ? "Khá tốt" : score >= 40 ? "Cần cố gắng" : "Cần ôn lại";
    const RING_R = 38, RING_C = 2 * Math.PI * RING_R;
    const targetOffset = score !== null ? RING_C * (1 - score / 100) : RING_C;
    const RUBRICS = [
      { key: "accuracy",  label: "Chính xác" },
      { key: "evidence",  label: "Bằng chứng" },
      { key: "logic",     label: "Logic" },
      { key: "relevance", label: "Liên quan" },
    ];
    const weaknesses = [...(ev.weaknesses || []), ...(ev.knowledge_gaps || [])];

    return (
      <div className="feature-page">
        <div className="debate-result-card">

          {/* ── Score ring ── */}
          <div className="result-score-wrap">
            <div style={{ position: "relative", display: "inline-flex" }}>
              <svg viewBox="0 0 90 90" width="90" height="90" style={{ display: "block" }}>
                <circle cx="45" cy="45" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle cx="45" cy="45" r={RING_R} fill="none"
                  stroke={scoreColor} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={RING_C}
                  className="result-ring-arc"
                  style={{ "--target": targetOffset }}
                  transform="rotate(-90 45 45)"
                />
              </svg>
              <div className="result-score-center">
                <span className="result-score-num" style={{ color: scoreColor }}>
                  {score !== null ? score : "--"}
                </span>
                <span className="result-score-denom">/100</span>
              </div>
            </div>
            <span className="result-score-label" style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>

          {/* ── Rubric bars ── */}
          {Object.keys(rubric).length > 0 && (
            <div className="result-rubric">
              {RUBRICS.map(({ key, label }, i) => {
                const val = rubric[key] ?? 0;
                return (
                  <div key={key} className="rubric-row" style={{ animationDelay: `${0.5 + i * 0.09}s` }}>
                    <span className="rubric-label">{label}</span>
                    <div className="rubric-track">
                      <div className="rubric-fill" style={{ "--w": `${(val / 25) * 100}%`, animationDelay: `${0.6 + i * 0.09}s` }} />
                    </div>
                    <span className="rubric-val">{val}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Sections ── */}
          {ev.feedback && (
            <details className="result-section" open>
              <summary><span>💡</span> Nhận xét</summary>
              <p className="result-sec-body">{ev.feedback}</p>
            </details>
          )}
          {ev.strengths?.length > 0 && (
            <details className="result-section">
              <summary><span>💪</span> Điểm mạnh</summary>
              <ul className="result-sec-list result-sec-list--green">
                {ev.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </details>
          )}
          {weaknesses.length > 0 && (
            <details className="result-section">
              <summary><span>⚠️</span> Cần cải thiện</summary>
              <ul className="result-sec-list result-sec-list--amber">
                {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </details>
          )}
          {ev.ideal_answer && (
            <details className="result-section">
              <summary><span>🎯</span> Gợi ý lý tưởng</summary>
              <p className="result-sec-body result-sec-ideal">{ev.ideal_answer}</p>
            </details>
          )}
        </div>

        <div className="feature-actions" style={{ marginTop: 16 }}>
          <button className="hero-btn hero-btn--ghost" onClick={() => { setDebateFinished(false); setMessages([]); setCurrentSessionId(""); }}>
            Thử thách lại
          </button>
        </div>
      </div>
    );
  }

  if (debateActive) {
    const isUrgent = timeLeft !== null && timeLeft <= 30;
    const progress = totalTimeRef.current ? (timeLeft ?? 0) / totalTimeRef.current : 1;
    const dashOffset = RING_C * (1 - progress);

    return (
      <div className="feature-page">
        {isUnlimited ? (
          <div className="debate-clock">
            <div className="debate-live-badge">
              <span className="debate-live-dot" />
              LIVE
            </div>
            <p className="debate-clock-sub" style={{ marginTop: 10 }}>Đang thử thách</p>
            <div className="feature-actions" style={{ marginTop: 20, width: "100%" }}>
              {confirmAction ? (
                <div className="debate-confirm">
                  <p className="debate-confirm-msg">
                    {confirmAction === "finish" ? "Kết thúc và nhận kết quả ngay?" : "Hủy thử thách? Kết quả sẽ không được lưu."}
                  </p>
                  <button className={`hero-btn ${confirmAction === "finish" ? "hero-btn--green" : "hero-btn--red"}`}
                    onClick={() => { setConfirmAction(null); window.dispatchEvent(new CustomEvent(confirmAction === "finish" ? "ami-finish-debate" : "ami-cancel-debate")); }}>
                    Xác nhận
                  </button>
                  <button className="hero-btn hero-btn--ghost" onClick={() => setConfirmAction(null)}>Giữ lại</button>
                </div>
              ) : (
                <>
                  <button className="hero-btn hero-btn--green" onClick={() => setConfirmAction("finish")}>Kết thúc thử thách</button>
                  <button className="hero-btn hero-btn--red" onClick={() => setConfirmAction("cancel")}>Bỏ thử thách</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="debate-clock">
            <div className="debate-ring-wrap">
              <svg viewBox="0 0 120 120" width="140" height="140" style={{ display: "block" }}>
                <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle
                  cx="60" cy="60" r={RING_R}
                  fill="none"
                  stroke={isUrgent ? "#ef4444" : "#fb923c"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 60 60)"
                  className={`debate-ring-arc${isUrgent ? " is-urgent" : ""}`}
                />
              </svg>
              <div className="debate-ring-center">
                <span className={`debate-clock-time${isUrgent ? " is-urgent" : ""}`}>{fmt(timeLeft ?? 0)}</span>
                <span className="debate-clock-sub">còn lại</span>
              </div>
            </div>
            <div className="feature-actions" style={{ marginTop: 16, width: "100%" }}>
              {confirmAction === "cancel" ? (
                <div className="debate-confirm">
                  <p className="debate-confirm-msg">Hủy thử thách? Kết quả sẽ không được lưu.</p>
                  <button className="hero-btn hero-btn--red"
                    onClick={() => { setConfirmAction(null); window.dispatchEvent(new CustomEvent("ami-cancel-debate")); }}>
                    Xác nhận hủy
                  </button>
                  <button className="hero-btn hero-btn--ghost" onClick={() => setConfirmAction(null)}>Giữ lại</button>
                </div>
              ) : (
                <button className="hero-btn hero-btn--red" onClick={() => setConfirmAction("cancel")}>Bỏ thử thách</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="feature-page">
      <div className="feature-hero">
        <p className="panel-copy">Vấn đáp trực tiếp cùng Ami — Ami hỏi, bạn trả lời, lập luận và bảo vệ quan điểm trong thời gian giới hạn. Hết giờ, Ami chấm điểm và nhận xét ngay.</p>
      </div>
      {selectedSource ? (
        <>
          <div className="expr-group" style={{ marginBottom: 12 }}>
            <p className="expr-label">Thời gian</p>
            <div className="option-grid">
              {Object.entries(DEBATE_TIME_OPTIONS).map(([key, opt]) => (
                <button
                  key={key}
                  className={`option-button${timeOpt === key ? " is-active" : ""}`}
                  onClick={() => setTimeOpt(key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="feature-actions">
            <button className="hero-btn hero-btn--warm" onClick={() => window.dispatchEvent(new CustomEvent("ami-start-debate", { detail: timeOpt }))}>Bắt đầu thử thách</button>
          </div>
        </>
      ) : (
        <>
          <p className="panel-empty" style={{ marginBottom: 12 }}>Bạn cần chọn môn học trước để sử dụng tính năng này.</p>
          <div className="feature-actions">
            <button className="hero-btn hero-btn--green" onClick={() => openFeature("subjects", "debate")}>Chọn môn học</button>
          </div>
        </>
      )}
    </div>
  );
}

function FeatureLeaderboard() {
  const { selectedSource } = useAmi();
  const [leaderboard, setLeaderboard] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const refresh = React.useCallback(() => {
    if (!selectedSource) return;
    setLoading(true);
    fetchLeaderboard(selectedSource).then((d) => setLeaderboard(d.leaderboard || [])).catch(() => setLeaderboard([])).finally(() => setLoading(false));
  }, [selectedSource]);

  React.useEffect(() => { refresh(); }, [refresh]);

  React.useEffect(() => {
    window.addEventListener("ami-debate-ended", refresh);
    return () => window.removeEventListener("ami-debate-ended", refresh);
  }, [refresh]);
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

const FEATURE_PAGES = { subjects: FeatureSubjects, history: FeatureHistory, debate: FeatureDebate, leaderboard: FeatureLeaderboard, expressions: FeatureExpressions, profile: FeatureProfile };

export default function DrawerPage({ feature }) {
  const Active = FEATURE_PAGES[feature];
  if (!Active) return <p className="panel-empty">Chọn một mục từ menu</p>;
  return <Active />;
}
