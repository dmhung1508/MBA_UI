// API Configuration
// This file centralizes all API-related configuration

// Base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Service-specific base URLs
const AUTH_MINI_BASE = `${API_BASE_URL}/auth_mini`;
const MBA_MINI_BASE = `${API_BASE_URL}/mba_mini`;

export const API_ENDPOINTS = {
  // ============================================
  // AUTH_MINI SERVICE - Authentication & Admin
  // ============================================

  // Authentication
  TOKEN: `${AUTH_MINI_BASE}/token`,
  LOGIN: `${AUTH_MINI_BASE}/login`,
  REGISTER: `${AUTH_MINI_BASE}/register`,
  SIGNUP: `${AUTH_MINI_BASE}/signup`,
  LOGOUT: `${AUTH_MINI_BASE}/logout`,

  // Chatbots
  CHATBOTS: `${AUTH_MINI_BASE}/chatbots`,
  CHATBOT_BY_ID: (id) => `${AUTH_MINI_BASE}/chatbots/${id}`,

  // Files (auth_mini endpoints)
  FILE_UPLOAD: `${AUTH_MINI_BASE}/mba/upload`,
  FILE_METADATA: (source) => `${AUTH_MINI_BASE}/mba/files/${source}/metadata`,
  FILE_VIEW: (source, filename) => `${AUTH_MINI_BASE}/mba/files/${source}/view/${filename}`,
  FILE_DELETE: (source, filename) => `${AUTH_MINI_BASE}/mba/files/${source}/delete/${filename}`,
  FILE_DELETE_BY_FILENAME: (source, filename) => `${AUTH_MINI_BASE}/mba/files/${source}/by-filename/${filename}?delete_original_file=true`,

  // Chat History (auth_mini)
  CHAT_HISTORY: (userId, limit, skip, source) => `${AUTH_MINI_BASE}/mba/chat_history/${userId}?limit=${limit}&skip=${skip}&source=${source}`,
  DELETE_CHAT_HISTORY: (userId, source) => `${AUTH_MINI_BASE}/mba/chat_history/${userId}?source=${source}`,

  // Quiz
  RANDOM_QUESTIONS: (topic) => `${AUTH_MINI_BASE}/random-questions?topic=${topic}`,
  SUBMIT_QUIZ: `${AUTH_MINI_BASE}/submit_quiz`,
  QUIZ_HISTORY: `${AUTH_MINI_BASE}/quiz_history`,

  // Profile
  PROFILE: `${AUTH_MINI_BASE}/profile`,
  USERS_ME: `${AUTH_MINI_BASE}/users/me`,
  CHANGE_PASSWORD: `${AUTH_MINI_BASE}/change-password`,

  // Admin - Chatbots
  ADMIN_CHATBOTS: `${AUTH_MINI_BASE}/admin/chatbots`,
  ADMIN_CHATBOT_BY_ID: (id) => `${AUTH_MINI_BASE}/admin/chatbots/${id}`,

  // Admin - Questions
  ADMIN_QUESTIONS: (topic) => `${AUTH_MINI_BASE}/admin/questions/${topic}`,
  ADMIN_QUESTION_CREATE: `${AUTH_MINI_BASE}/admin/question`,
  ADMIN_QUESTIONS_BULK: `${AUTH_MINI_BASE}/admin/questions`,
  ADMIN_QUESTION_BY_ID: (topic, index) => `${AUTH_MINI_BASE}/admin/questions/${topic}/${index}`,
  ADMIN_QUESTIONS_UPLOAD_EXCEL: `${AUTH_MINI_BASE}/admin/questions/upload-excel`,
  ADMIN_SEARCH_QUESTIONS: `${AUTH_MINI_BASE}/admin/search-questions`,

  // Admin - Users
  ADMIN_USERS: `${AUTH_MINI_BASE}/users`,
  ADMIN_USER_ROLE: (username) => `${AUTH_MINI_BASE}/admin/users/${username}/role`,
  ADMIN_USER_ASSIGN_TOPICS: (username) => `${AUTH_MINI_BASE}/admin/users/${username}/assign-topics`,

  // Admin - Logs
  ADMIN_LOGS: `${AUTH_MINI_BASE}/admin/logs`,

  // Teacher
  TEACHER_MY_TOPICS: `${AUTH_MINI_BASE}/teacher/my-topics`,
  TEACHER_QUIZ_HISTORY: `${AUTH_MINI_BASE}/teacher/quiz-history`,

  // ============================================
  // MBA_MINI SERVICE - RAG, Search, AI Features
  // ============================================

  // RAG & Chat
  RAG: (time, query, source, save) => `${AUTH_MINI_BASE}/mba/rag/?time=${time}&q=${encodeURIComponent(query)}&source=${source}&save=${save}`,
  MBA_RAG_TONGHOP: (time, query) => `${MBA_MINI_BASE}/tonghop/?time=${time}&q=${encodeURIComponent(query)}`,
  MBA_EXPLANATION: `${MBA_MINI_BASE}/explanation/`,

  // Search
  MBA_SEARCH: `${MBA_MINI_BASE}/search`,

  // Chroma Management
  MBA_UPDATE_CHROMA: `${MBA_MINI_BASE}/update-chroma`,

  // Source Management
  MBA_SOURCE_USERS: (topic, limit, offset) => `${MBA_MINI_BASE}/source/${encodeURIComponent(topic)}/users?limit=${limit}&skip=${offset}`,
};

export default API_BASE_URL;
