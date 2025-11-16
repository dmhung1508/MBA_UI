import React from "react";

const MicrosoftLoginButton = () => {
  const CLIENT_ID = "7bf686f1-841b-46be-8495-d05ea42d0348";
  const TENANT_ID = "1cdffff7-92cd-412a-9956-d8f698af523d"; // tenant GUID
  const REDIRECT_URI = "http://localhost:8000/auth/callback1/";

  const AUTH_URL = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;
  const SCOPES = ["openid", "profile", "email", "offline_access", "User.Read"];

  const loginUrl =
    `${AUTH_URL}?client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}`;

  return (
    <div className="mt-6">
      <a
        href={loginUrl}
        className="flex items-center justify-center gap-3 w-full max-w-md mx-auto px-4 py-3 border border-red-600 text-red-600 font-medium rounded-lg transition-colors shadow-md"
      >
        <img
          src="https://img.icons8.com/color/48/microsoft.png"
          alt="microsoft"
          className="w-5 h-5"
        />
        Đăng nhập bằng Microsoft
      </a>
    </div>
  );
};

export default MicrosoftLoginButton;
