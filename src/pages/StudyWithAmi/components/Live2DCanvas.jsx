import React, { useRef, useImperativeHandle, forwardRef } from "react";
import useLive2D from "../../../hooks/useLive2D";

const AMI_BASE = import.meta.env.BASE_URL || "/";
const AMI_AVATAR = `${AMI_BASE}ami-avatar.png`;

const Live2DCanvas = forwardRef(function Live2DCanvas(_props, ref) {
  const containerRef = useRef(null);
  const { ready, error, fitModel, playMotion, setExpression, notifyActivity, mouthHold, costumeController } = useLive2D(containerRef);

  useImperativeHandle(ref, () => ({
    ready,
    fitModel,
    playMotion,
    setExpression,
    notifyActivity,
    mouthHold,
    costumeController,
  }), [ready, fitModel, playMotion, setExpression, notifyActivity, mouthHold, costumeController]);

  return (
    <>
      {!ready && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[#0f172a]">
          <div className="w-[88px] h-[88px] rounded-full border-[3px] border-[rgba(255,43,120,0.7)] shadow-[0_0_40px_rgba(255,43,120,0.5)] overflow-hidden flex-shrink-0 animate-ami-float">
            <img src={AMI_AVATAR} alt="Ami" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <p className="text-white text-lg font-semibold m-0">Ami đang thức dậy...</p>
            <p className="text-[rgba(255,255,255,0.5)] text-sm mt-1.5">Bạn vui lòng chờ Ami xíu nhé!</p>
          </div>
          <div className="w-[200px] h-[3px] rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ff2b78] to-[#ff6b6b] animate-ami-bar" />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0f172a]">
          <p className="text-[rgba(255,255,255,0.7)] text-sm">
            Ami chưa tải xong mô hình. Bạn thử tải lại trang nhé.
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="absolute inset-0 z-[1]"
      />
    </>
  );
});

export default Live2DCanvas;
