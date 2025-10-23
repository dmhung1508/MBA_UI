const dataFAQs = [
  ["Chatbot hoạt động như thế nào?", "Chatbot hoạt động bằng cách lấy từ câu hỏi của người dùng, sử dụng kỹ thuật tìm kiếm văn bản liên quan đến câu hỏi trong tập dữ liệu vector hóa (độ tương đồng văn bản) và lưu trữ thông qua cơ sở dữ liệu vector. Giúp truy xuất văn bản liên quan và sau đó sử dụng mô hình ngôn ngữ lớn Vietcuna (LLM) để tạo câu trả lời."],
  ["Làm thế nào để sử dụng chatbot tra cứu thông tin", "Để sử dụng chatbot hiệu quả nhất, bạn nên đặt câu hỏi đủ rõ ràng để mô hình có thể đưa ra câu trả lời chính xác. Tuy nhiên, trong một số trường hợp câu trả lời có thể không chính xác, vì vậy bạn phải xác minh thông tin hoặc liên hệ hỗ trợ nếu cần thiết."],
  ["Thông tin từ chatbot có đáng tin cậy không?", "Vì đây là mô hình xác suất, thông tin mà chatbot cung cấp có thể không chính xác trong một số trường hợp, bạn nên xác minh thông tin hoặc liên hệ hỗ trợ nếu cần thiết"],
  ["Tôi có thể liên hệ hỗ trợ như thế nào?", "Truy cập vào phần Góp ý/Báo lỗi hoặc phòng công tác sinh viên của trường."],
];

function FAQPage() {
  return (
    <div className="flex justify-center min-h-[85vh] h-auto bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="md:w-[50%]">
        <h1 className="text-3xl text-center font-bold p-5 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)]">Các câu hỏi thường gặp (FAQs)</h1>
        {
          dataFAQs.map((item,i)=><div key={i} className="mt-2 collapse collapse-plus shadow-md rounded-xl bg-white">
          <input type="checkbox" />
          <div className="collapse-title text-base font-medium">
            {item[0]}
          </div>
          <div className="collapse-content">
            <p>{item[1]}</p>
          </div>
        </div>
          )
        }
      </div>
    </div>
  );
}
export default FAQPage;
