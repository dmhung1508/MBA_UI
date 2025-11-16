import { useEffect, useState } from "react";
// import NavBar from "./components/NavBar";
// import HomePage from "./pages/HomePage";
import ChatBot from "./components/ChatBot";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Profile from "./pages/Profile";
import QuizHistory from "./pages/QuizHistory";
import Test from "./pages/Test";
import EditPage from "./pages/EditPage";
import AdminDashboard from "./pages/AdminDashboard";
import SourceManager from "./pages/SourceManager";
import QuestionManager from "./pages/QuestionManager";
import UserManager from "./pages/UserManager";
import TeacherDashboard from "./pages/TeacherDashboard";
import MessageManager from "./pages/MessageManager";
import TestPage from "./pages/TestPage";
import AdminLogs from "./pages/AdminLogs";
// import FAQPage from "./pages/FAQPage"
// import IssuePage from "./pages/IssuePage";
import { BrowserRouter, Routes, Route, Link, Navigate  } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";
import { ToastContainer } from 'react-toastify';
import AuthSuccess from './components/AuthSuccess.jsx'
import 'react-toastify/dist/ReactToastify.css';

function App() {
  useEffect(() => {}, []);
  const [currentPage, SetCurrentPage] = useState("Home");
  return (
    <BrowserRouter basename="/mini"> {/* Thêm basename vào đây */}
      <div className="App">
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
            path="/messages" 
            element={
              <PrivateRoute>
                <MessageManager />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/test-file" 
            element={
              <PrivateRoute>
                <TestPage />
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
          <Route path="/auth/success" element={<AuthSuccess />} />
        </Routes>
        
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