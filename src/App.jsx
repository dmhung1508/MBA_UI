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
// import FAQPage from "./pages/FAQPage"
// import IssuePage from "./pages/IssuePage";
import { BrowserRouter, Routes, Route, Link, Navigate  } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";

function App() {
  useEffect(() => {}, []);
  const [currentPage, SetCurrentPage] = useState("Home");
  return (
    <BrowserRouter basename="/chat"> {/* Thêm basename vào đây */}
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" 
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
        </Routes>
        
      </div> 
    </BrowserRouter>
  );
}

// PrivateRoute component to protect authenticated routes
function PrivateRoute({ children }) {
  const token = sessionStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
}

export default App;