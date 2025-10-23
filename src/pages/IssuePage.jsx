import emailjs from "@emailjs/browser";
import { useRef } from "react";
function IssuePage() {

  let templateParams = {
    from_name: "James",
    message: "Check this out!",
  };
  function sendMail() {
    emailjs
      .send(
        "<>",
        "template_azmnoyw",
        templateParams,
        "<>"
      )
      .then(
        function (response) {
          console.log("THÀNH CÔNG!", response.status, response.text);
        },
        function (error) {
          console.log("THẤT BẠI...", error);
        }
      );
  }

  return (
    <div className="flex justify-center h-[85vh] bg-gradient-to-br from-blue-100 to-purple-100">
      {/* Nút để mở modal */}
      {/* Đặt phần này trước thẻ </body> */}
      <input type="checkbox" id="my-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Gửi thành công 🥳</h3>
          <p className="py-4">
            Cảm ơn bạn đã gửi ý kiến/báo cáo lỗi 🤗. Chúng tôi sẽ xem xét những ý kiến này
            để cải thiện sản phẩm tốt hơn!
          </p>
          <div className="modal-action">
            <label htmlFor="my-modal" className="btn btn-success">
              Đóng
            </label>
          </div>
        </div>
      </div>
      <div className="md:w-[50%]">
        <h1 className="text-3xl text-center font-bold p-5 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)]">
          Báo cáo lỗi hoặc góp ý
        </h1>
        <p className="text-justify font-semibold text-sm pr-2 pl-2">
          Đóng góp của bạn sẽ là sự hỗ trợ lớn giúp
          sản phẩm của chúng tôi ngày càng tốt hơn.
        </p>

        <textarea
          placeholder="Nhập phản hồi của bạn tại đây!"
          className="mt-5 mb-3 h-[30%] textarea textarea-bordered textarea-md w-full "
        ></textarea>
        <input type="text" placeholder="Email của bạn" className="input w-full max-w-xs" />
        <label
          htmlFor="my-modal"
          // onClick={()=>sendMail()}
          className="mt-5 w-full btn btn-primary btn-md bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
        >
          Gửi ý kiến
        </label>
      </div>
    </div>
  );
}
export default IssuePage;
