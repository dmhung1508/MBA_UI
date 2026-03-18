import React, { useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "../config/api";

// KHÔNG dùng Navbar chính - trang này có thanh header riêng để tránh chồng chéo

function decodeJWT(token) {
    if (!token) return null;
    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64).split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
        );
        return JSON.parse(json);
    } catch { return null; }
}

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

const StudyWithAmi = () => {
    const iframeRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [chatbots, setChatbots] = useState([]);

    const AMI_URL = "/mini/ami_clone/index.html";
    const AMI_AVATAR = "/mini/ami-avatar.png";
    const HEADER_H = 48;

    // Lấy user info từ JWT — instant
    const token = localStorage.getItem("access_token");
    const jwt = decodeJWT(token);
    const userProfile = jwt ? {
        username: jwt.sub || jwt.username || "",
        full_name: jwt.full_name || jwt.name || "",
        role: localStorage.getItem("user_role") || jwt.role || "user",
    } : null;

    // Fetch danh sách chatbot (môn học) user được phép
    useEffect(() => {
        const fetchChatbots = async () => {
            if (!token) return;
            try {
                const res = await fetch(API_ENDPOINTS.CHATBOTS, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = await res.json();
                setChatbots(data.chatbots || []);
            } catch (e) {
                console.error("StudyWithAmi: fetchChatbots failed", e);
            }
        };
        fetchChatbots();
    }, []);

    // Gửi toàn bộ context vào iframe sau khi load
    const sendContextToIframe = () => {
        if (!iframeRef.current?.contentWindow) return;
        iframeRef.current.contentWindow.postMessage({
            type: "AMI_USER_SYNC",
            payload: userProfile ? {
                username: userProfile.username,
                fullName: userProfile.full_name,
                role: userProfile.role,
            } : null,
        }, "*");

        if (chatbots.length > 0 || token) {
            iframeRef.current.contentWindow.postMessage({
                type: "AMI_CHATBOTS_SYNC",
                payload: {
                    chatbots,
                    token,
                    // API base URL để iframe tự gọi RAG
                    apiBase: import.meta.env.VITE_API_BASE_URL || "",
                },
            }, "*");
        }
    };

    // Re-send khi chatbots load xong
    useEffect(() => {
        if (!isLoading) sendContextToIframe();
    }, [chatbots, isLoading]);

    const handleIframeLoad = () => {
        setIsLoading(false);
        sendContextToIframe();
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const goBack = () => window.history.back();

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFSChange);
        return () => document.removeEventListener("fullscreenchange", handleFSChange);
    }, []);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const displayName = toVietnameseOrder(userProfile?.full_name) || userProfile?.username || "";
    const initials = getInitials(userProfile?.full_name, userProfile?.username);

    return (
        <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0f172a", zIndex: 9999 }}>
            {/* ── Header ── */}
            {!isFullscreen && (
                <div style={{ height: HEADER_H, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.95) 100%)", borderBottom: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", zIndex: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <button onClick={goBack} title="Quay lại"
                            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <img src={AMI_AVATAR} alt="Ami" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(255,43,120,0.6)", flexShrink: 0 }} />
                        <span style={{ color: "#fff", fontWeight: 600, fontSize: 15 }}>Học bài cùng Ami</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLoading ? "#facc15" : "#22c55e", display: "inline-block", animation: isLoading ? "ami-pulse 1.5s ease-in-out infinite" : "none" }} />
                            {isLoading ? "Đang tải..." : "Sẵn sàng"}
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {displayName && (
                            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 10px 3px 5px", borderRadius: 999, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 11, color: "rgba(255,255,255,0.75)", maxWidth: 180, overflow: "hidden" }}>
                                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials}</div>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
                            </div>
                        )}
                        <button onClick={toggleFullscreen} title="Toàn màn hình"
                            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Loading overlay ── */}
            {isLoading && (
                <div style={{ position: "absolute", inset: isFullscreen ? 0 : `${HEADER_H}px 0 0 0`, background: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 5 }}>
                    <div style={{ width: 88, height: 88, borderRadius: "50%", border: "3px solid rgba(255,43,120,0.7)", boxShadow: "0 0 40px rgba(255,43,120,0.5)", animation: "ami-float 2s ease-in-out infinite", overflow: "hidden", flexShrink: 0 }}>
                        <img src={AMI_AVATAR} alt="Ami" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ color: "#fff", fontSize: 18, fontWeight: 600, margin: 0 }}>Ami đang thức dậy...</p>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "6px 0 0" }}>Đang tải mô hình Live2D</p>
                    </div>
                    <div style={{ width: 200, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff2b78,#ff6b6b)", animation: "ami-bar 2s ease-in-out infinite" }} />
                    </div>
                </div>
            )}

            {/* ── Iframe ── */}
            <iframe ref={iframeRef} src={AMI_URL} onLoad={handleIframeLoad} title="Học bài cùng Ami" frameBorder="0" allowFullScreen
                style={{ flex: 1, width: "100%", border: "none", display: "block", opacity: isLoading ? 0 : 1, transition: "opacity 0.5s ease" }} />

            <style>{`
        @keyframes ami-pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes ami-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)} }
        @keyframes ami-bar   { 0%{width:0%;margin-left:0%}50%{width:70%;margin-left:15%}100%{width:0%;margin-left:100%} }
      `}</style>
        </div>
    );
};

export default StudyWithAmi;
