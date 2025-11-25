import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_GET_TOKEN = import.meta.env.VITE_API_GET_TOKEN
const AuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const redirect_uri = `${API_BASE_URL}/mini/access-auth`

  useEffect(() => {
    const handleAuth = async () => {
      if (!code) {
        setLoading(false);
        console.error("No code found in callback URL");
        return;
      }

      try {
        const tokenResponse = await fetch(
          `${API_GET_TOKEN}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: code,
              redirect_uri: redirect_uri, 
              client_id: "ptit-connect",
            }),
          }
        );

        if (!tokenResponse.ok) {
          const errText = await tokenResponse.text();
          console.error("Error fetching SSO token:", errText);
          setLoading(false);
          return;
        }

        const ssoData = await tokenResponse.json();
        const ssoAccessToken = ssoData.access_token;

        if (!ssoAccessToken) {
          console.error("No access_token returned from SSO", ssoData);
          setLoading(false);
          return;
        }

        const appTokenResponse = await fetch(
          `${API_BASE_URL}/auth_mini/generate/access-token`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ssoAccessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}), 
          }
        );

        if (!appTokenResponse.ok) {
          const errText = await appTokenResponse.text();
          console.error("Error fetching app access token:", errText);
          setLoading(false);
          return;
        }

        const appTokenData = await appTokenResponse.json();
        const { access_token, token_type, user_role } = appTokenData;

        if (!access_token) {
          console.error("No app access_token returned:", appTokenData);
          setLoading(false);
          return;
        }

        const expirationTime =
          Date.now() + 365 * 24 * 60 * 60 * 1000; 
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_type", token_type || "bearer");
        localStorage.setItem("user_role", user_role || "USER");
        localStorage.setItem("token_expiration", expirationTime.toString());
        window.history.replaceState({}, document.title, "/auth/success");
        setSuccessMessage("Đăng nhập thành công!");
        setLoading(false);

        setTimeout(() => {
          navigate("/");
        }, 800);
      } catch (error) {
        console.error("Unexpected error in auth flow:", error);
        setLoading(false);
      }
    };

    handleAuth();
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4"></div>
          <p className="text-gray-700 font-medium">Đang đăng nhập...</p>
        </div>
      )}

      {!loading && successMessage && (
        <p className="text-green-600 font-semibold mt-4">
          {successMessage}
        </p>
      )}

      <style>
        {`
          .loader {
            border-top-color: #f87171; /* đỏ nhạt */
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default AuthSuccess;
