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
  TEACHER_ACTIVITY_STATS: `${AUTH_MINI_BASE}/admin/teacher-stats`,
  TEACHER_ACTIVITY_STATS_EXPORT: `${AUTH_MINI_BASE}/admin/teacher-stats/export`,

  // AI Q&A (Vấn đáp với AI)
  AI_QA_RANDOM_QUESTION: (topic) => `${AUTH_MINI_BASE}/ai-qa/random-question?topic=${topic}`,
  AI_QA_SUBMIT: `${AUTH_MINI_BASE}/ai-qa/submit`,
  AI_QA_MY_RESPONSES: `${AUTH_MINI_BASE}/ai-qa/my-responses`,
  TEACHER_AI_QA_RESPONSES: `${AUTH_MINI_BASE}/teacher/ai-qa/responses`,
  TEACHER_AI_QA_EVALUATE: (responseId) => `${AUTH_MINI_BASE}/teacher/ai-qa/evaluate/${responseId}`,
  TEACHER_AI_QA_STATS: `${AUTH_MINI_BASE}/teacher/ai-qa/stats`,

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

  // ============================================
  // TICKET SYSTEM
  // ============================================

  // User Ticket Endpoints
  TICKET_CREATE: `${AUTH_MINI_BASE}/tickets`,
  TICKET_MY_LIST: (limit, offset, status, type) =>
    `${AUTH_MINI_BASE}/tickets/my?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ''}${type ? `&type=${type}` : ''}`,
  TICKET_DETAIL: (ticketId) => `${AUTH_MINI_BASE}/tickets/${ticketId}`,
  TICKET_CLOSE: (ticketId) => `${AUTH_MINI_BASE}/tickets/${ticketId}/close`,
  TICKET_REOPEN: (ticketId) => `${AUTH_MINI_BASE}/tickets/${ticketId}/reopen`,
  TICKET_ADD_COMMENT: (ticketId) => `${AUTH_MINI_BASE}/tickets/${ticketId}/comments`,
  TICKET_UPLOAD_ATTACHMENT: `${AUTH_MINI_BASE}/tickets/upload`,
  TICKET_DOWNLOAD_ATTACHMENT: (ticketId, filename) => `${AUTH_MINI_BASE}/tickets/${ticketId}/attachments/${encodeURIComponent(filename)}`,
  TICKET_OPEN_COUNT: `${AUTH_MINI_BASE}/tickets/count/open`,

  // Comment Attachments
  COMMENT_UPLOAD_ATTACHMENT: (commentId) => `${AUTH_MINI_BASE}/tickets/comments/${commentId}/upload`,
  COMMENT_DOWNLOAD_ATTACHMENT: (commentId, filename) => `${AUTH_MINI_BASE}/tickets/comments/${commentId}/attachments/${encodeURIComponent(filename)}`,

  // Admin Ticket Endpoints
  ADMIN_TICKETS_LIST: (limit, offset, status, type, assigned_to, search) =>
    `${AUTH_MINI_BASE}/admin/tickets?limit=${limit}&offset=${offset}${status ? `&status=${status}` : ''}${type ? `&type=${type}` : ''}${assigned_to ? `&assigned_to=${assigned_to}` : ''}${search ? `&search=${search}` : ''}`,
  ADMIN_TICKET_UPDATE: (ticketId) => `${AUTH_MINI_BASE}/admin/tickets/${ticketId}`,
  ADMIN_TICKET_DELETE: (ticketId) => `${AUTH_MINI_BASE}/admin/tickets/${ticketId}`,
  ADMIN_TICKET_STATS: `${AUTH_MINI_BASE}/admin/tickets/stats`,
};

export default API_BASE_URL;
