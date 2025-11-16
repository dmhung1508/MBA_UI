import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const AuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("access_token");
    const type = params.get("token_type");
    const role = params.get("user_role");

    const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000);

    if (token) {
      // Lưu token vào localStorage
      localStorage.setItem("access_token", token);
      localStorage.setItem("token_type", type);
      localStorage.setItem("user_role", role);
      localStorage.setItem('token_expiration', expirationTime.toString());

      // Xóa query param khỏi URL
      window.history.replaceState({}, document.title, "/auth/success");

      // Chuyển hướng sau khi lưu xong
      setTimeout(() => {
        navigate("/mini/"); // chuyển sang /mini
      }, 1000); // 1s để hiển thị loading
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4"></div>
          <p className="text-gray-700 font-medium">Đang đăng nhập...</p>
        </div>
      )}
      <style>
        {`
          .loader {
            border-top-color: #f87171; /* đỏ nhạt */
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
};

export default AuthSuccess;
