const dataFAQs = [["How does Chatbot work?","Chatbot works by taking from the user's question, using the technique of finding text related to the question in a vectorized data set (text similarity) and Stored through vector database. Helps retrieve relevant text and then use Vietcuna large language model (LLM) to generate answers."],
["How to use chatbot to look up information","To use chatbot most effectively, you should ask the question clearly enough so that the model can give the correct answer. However, In some cases the answer may not be accurate, so you must verify the information or contact support if necessary."],
["Is the information from the chatbot reliable?","Because it is a probabilistic model, the information the chatbot provides may be inaccurate in some cases, you should verify the information or contact support if necessary"],
["How can I contact support?","Go to the Suggestions/Error Report section or the school's student affairs office."],
]
function FAQPage() {
  return (
    <div className="flex justify-center min-h-[85vh] h-auto bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="md:w-[50%]">
        <h1 className="text-3xl text-center font-bold p-5 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)]">Frequently asked questions (FAQs)</h1>
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

        {/* <div className="mt-2 collapse collapse-plus shadow-md rounded-xl bg-white">
          <input type="checkbox" />
          <div className="collapse-title text-base font-medium">
            Cách sử dụng chatbot để tra cứu thông tin
          </div>
          <div className="collapse-content">
            <p>hello</p>
          </div>
        </div>
        <div className="mt-2 collapse collapse-plus shadow-md rounded-xl bg-white">
          <input type="checkbox" />
          <div className="collapse-title text-base font-medium">
          Thông tin từ chatbot có đáng tin cậy không?
          </div>
          <div className="collapse-content">
            <p>hello</p>
          </div>
        </div>
        <div className="mt-2 collapse collapse-plus shadow-md rounded-xl bg-white">
          <input type="checkbox" />
          <div className="collapse-title text-base font-medium">
          Tôi có thể liên hệ hỗ trợ như thế nào?
          </div>
          <div className="collapse-content">
            <p>hello</p>
          </div>
        </div> */}
      </div>
    </div>
  );
}
export default FAQPage;
