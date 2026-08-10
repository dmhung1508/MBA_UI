import axios from "axios";

export const ACADEMIC_TERM_HEADER = "X-Academic-Term";
export const SELECTED_TERM_KEY = "selected_academic_term";
export const LATEST_TERM_KEY = "latest_academic_term";
export const TERM_EVENT = "academic-term-change";

let installed = false;

export function canSelectAcademicTerm(role = null) {
  const userRole = role || localStorage.getItem("user_role");
  return userRole === "admin" || userRole === "teacher";
}

export function getSelectedAcademicTerm() {
  return localStorage.getItem(SELECTED_TERM_KEY) || "";
}

export function getLatestAcademicTerm() {
  return localStorage.getItem(LATEST_TERM_KEY) || "";
}

export function getEffectiveAcademicTerm(role = null) {
  const latest = getLatestAcademicTerm();
  if (!canSelectAcademicTerm(role)) {
    return latest;
  }
  return getSelectedAcademicTerm() || latest;
}

export function storeAcademicTermState({ latestTerm, selectedTerm }) {
  if (latestTerm) {
    localStorage.setItem(LATEST_TERM_KEY, latestTerm);
  }
  if (selectedTerm && canSelectAcademicTerm()) {
    localStorage.setItem(SELECTED_TERM_KEY, selectedTerm);
  }
}

export function setSelectedAcademicTerm(term) {
  if (term) {
    localStorage.setItem(SELECTED_TERM_KEY, term);
  } else {
    localStorage.removeItem(SELECTED_TERM_KEY);
  }
  window.dispatchEvent(new CustomEvent(TERM_EVENT, { detail: { term } }));
}

function withAcademicTermHeader(headers) {
  const term = getEffectiveAcademicTerm();
  if (!term) {
    return headers;
  }
  const nextHeaders = new Headers(headers || {});
  if (!nextHeaders.has(ACADEMIC_TERM_HEADER)) {
    nextHeaders.set(ACADEMIC_TERM_HEADER, term);
  }
  return nextHeaders;
}

export function installAcademicTermRequestMiddleware() {
  if (installed || typeof window === "undefined") {
    return;
  }
  installed = true;

  if (window.fetch) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
      const headers = withAcademicTermHeader(
        init.headers || (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined)
      );
      return originalFetch(input, { ...init, headers });
    };
  }

  axios.interceptors.request.use((config) => {
    const term = getEffectiveAcademicTerm();
    if (!term) {
      return config;
    }
    config.headers = config.headers || {};
    if (!config.headers[ACADEMIC_TERM_HEADER]) {
      config.headers[ACADEMIC_TERM_HEADER] = term;
    }
    return config;
  });
}
