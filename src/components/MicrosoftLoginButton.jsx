import React from "react";

const MicrosoftLoginButton = () => {
  const redirect_uri = "https://mini.dinhmanhhung.net/mini/access-auth"

  const loginUrl = `https://gwdu.ptit.edu.vn/sso/realms/ptit/protocol/openid-connect/auth?client_id=ptit-connect&response_type=code&redirect_uri=${redirect_uri}&scope=openid%20profile%20email&state=abc123xyz`

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
