import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { resolveApiBaseUrl, resolveBaseUrl } from "../config/runtimeConfig";

const API_BASE_URL = resolveApiBaseUrl();
const BASE_URL = resolveBaseUrl();
const API_GET_TOKEN = import.meta.env.VITE_API_GET_TOKEN
const AuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const exchangeStartedRef = useRef(false);

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const providerError = params.get("error");
  const providerErrorDescription = params.get("error_description");
  const redirect_uri = `${BASE_URL}/mini/access-auth`

  useEffect(() => {
    // React.StrictMode invokes effects twice in development. An OAuth
    // authorization code can only be exchanged once, so guard this flow.
    if (exchangeStartedRef.current) {
      return;
    }
    exchangeStartedRef.current = true;

    const handleAuth = async () => {
      if (providerError) {
        setErrorMessage(
          providerErrorDescription || "Đăng nhập SSO đã bị huỷ hoặc từ chối."
        );
        setLoading(false);
        return;
      }

      if (!code) {
        setErrorMessage("Không nhận được mã xác thực từ hệ thống SSO.");
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
          setErrorMessage(
            "Không thể xác thực mã đăng nhập SSO. Vui lòng đăng nhập lại."
          );
          setLoading(false);
          return;
        }

        const ssoData = await tokenResponse.json();
        const ssoAccessToken = ssoData.access_token;

        if (!ssoAccessToken) {
          console.error("No access_token returned from SSO", ssoData);
          setErrorMessage("Hệ thống SSO không trả về access token.");
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
          setErrorMessage("Không thể tạo phiên đăng nhập. Vui lòng thử lại.");
          setLoading(false);
          return;
        }

        const appTokenData = await appTokenResponse.json();
        const { access_token, token_type, user_role } = appTokenData;

        if (!access_token) {
          console.error("No app access_token returned:", appTokenData);
          setErrorMessage("Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.");
          setLoading(false);
          return;
        }

        const expirationTime =
          Date.now() + 30 * 60 * 1000;
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("token_type", token_type || "bearer");
        localStorage.setItem("user_role", user_role || "USER");
        localStorage.setItem("token_expiration", expirationTime.toString());
        sessionStorage.setItem("check_rating", "true");
        window.history.replaceState({}, document.title, "/mini/access-auth");
        setSuccessMessage("Đăng nhập thành công!");
        setLoading(false);

        setTimeout(() => {
          window.location.href = "/mini/";
        }, 800);
      } catch (error) {
        console.error("Unexpected error in auth flow:", error);
        setErrorMessage(
          "Không thể kết nối tới hệ thống đăng nhập. Vui lòng thử lại."
        );
        setLoading(false);
      }
    };

    handleAuth();
  }, [code, navigate, providerError, providerErrorDescription, redirect_uri]);

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

      {!loading && errorMessage && (
        <div className="mx-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center shadow-sm">
          <p className="font-semibold text-red-700">Đăng nhập không thành công</p>
          <p className="mt-2 text-sm text-gray-700">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
          >
            Quay lại đăng nhập
          </button>
        </div>
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
