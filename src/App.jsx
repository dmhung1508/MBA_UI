import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Eager load critical pages (HomePage and LoginPage)
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

// Lazy load all other routes for code splitting
const ChatBot = lazy(() => import("./components/ChatBot"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const Profile = lazy(() => import("./pages/Profile"));
const QuizHistory = lazy(() => import("./pages/QuizHistory"));
const Test = lazy(() => import("./pages/Test"));
const EditPage = lazy(() => import("./pages/EditPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SourceManager = lazy(() => import("./pages/SourceManager"));
const QuestionManager = lazy(() => import("./pages/QuestionManager"));
const UserManager = lazy(() => import("./pages/UserManager"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const TeacherQuizHistory = lazy(() => import("./pages/TeacherQuizHistory"));
const TeacherStats = lazy(() => import("./pages/TeacherStats"));
const MessageManager = lazy(() => import("./pages/MessageManager"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AuthSuccess = lazy(() => import('./components/AuthSuccess.jsx'));

// Ticket System pages
const MyTickets = lazy(() => import("./pages/MyTickets"));
const AdminTickets = lazy(() => import("./pages/AdminTickets"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
  </div>
);

function App() {
  useEffect(() => { }, []);
  const [currentPage, SetCurrentPage] = useState("Home");
  return (
    <BrowserRouter basename="/mini" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> {/* Thêm basename vào đây */}
      <div className="App">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mini"
            element={
              <PrivateRoute>
                <ChatBot />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/account"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/quiz-history"
            element={
              <PrivateRoute>
                <QuizHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/test"
            element={
              <PrivateRoute>
                <Test />
              </PrivateRoute>
            }
          />
          <Route
            path="/edit"
            element={
              <PrivateRoute>
                <EditPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher-stats"
            element={
              <PrivateRoute>
                <TeacherStats />
              </PrivateRoute>
            }
          />
          <Route
            path="/sources"
            element={
              <PrivateRoute>
                <SourceManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <PrivateRoute>
                <QuestionManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UserManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute>
                <TeacherDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/quiz-history"
            element={
              <PrivateRoute>
                <TeacherQuizHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <MessageManager />
              </PrivateRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <PrivateRoute>
                <AdminLogs />
              </PrivateRoute>
            }
          />
          <Route
            path="/tickets"
            element={
              <PrivateRoute>
                <MyTickets />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <PrivateRoute>
                <AdminTickets />
              </PrivateRoute>
            }
          />
          <Route path="/access-auth" element={<AuthSuccess />} />
          </Routes>
        </Suspense>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </BrowserRouter>
  );
}

// PrivateRoute component to protect authenticated routes
function PrivateRoute({ children }) {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/mini/login" />;
}

export default App;