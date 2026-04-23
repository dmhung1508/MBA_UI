import React, { useState } from 'react';
import { FaStar, FaPaperPlane } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-toastify';

const QUESTIONS = [
  {
    section: '1. Giao diện & Trải nghiệm (UI/UX)',
    items: [
      { key: 'q1_ui_intuitive', label: 'Giao diện của hệ thống được thiết kế trực quan, rõ ràng và dễ nhìn.' },
      { key: 'q2_ui_easy', label: 'Tôi có thể dễ dàng thao tác trên hệ thống mà không cần hướng dẫn.' },
    ],
  },
  {
    section: '2. Hiệu suất & Độ ổn định',
    items: [
      { key: 'q3_perf_fast', label: 'Hệ thống phản hồi các thao tác của tôi một cách nhanh chóng.' },
      { key: 'q4_perf_stable', label: 'Hệ thống hoạt động ổn định, không bị lỗi hay gián đoạn.' },
    ],
  },
  {
    section: '3. Tính năng & Độ hữu ích',
    items: [
      { key: 'q5_feat_useful', label: 'Các tính năng hiện tại đáp ứng tốt nhu cầu sử dụng của tôi.' },
      { key: 'q6_feat_accurate', label: 'Thông tin và kết quả hệ thống trả về rất chính xác và hữu ích.' },
    ],
  },
  {
    section: '4. Đánh giá tổng thể',
    items: [
      { key: 'q7_overall', label: 'Mức độ hài lòng chung của bạn với trải nghiệm trên hệ thống này.' },
    ],
  },
];

const SCALE_LABELS = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất hài lòng'];

const StarRating = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="focus:outline-none transition-transform hover:scale-110"
        title={SCALE_LABELS[star]}
      >
        <FaStar
          size={24}
          className={star <= value ? 'text-yellow-400' : 'text-gray-300'}
        />
      </button>
    ))}
    {value > 0 && (
      <span className="ml-2 text-sm text-gray-500">{SCALE_LABELS[value]}</span>
    )}
  </div>
);

const RatingPopup = ({ onClose }) => {
  const initialScores = Object.fromEntries(
    QUESTIONS.flatMap((g) => g.items.map((q) => [q.key, 0]))
  );
  const [scores, setScores] = useState(initialScores);
  const [suggestion, setSuggestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = Object.values(scores).every((v) => v > 0);

  const handleSubmit = async () => {
    if (!allAnswered) {
      toast.warning('Vui lòng trả lời tất cả câu hỏi trước khi gửi.');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(API_ENDPOINTS.RATING_SUBMIT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...scores, suggestion }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gửi đánh giá thất bại.');
      }
      toast.success('Cảm ơn bạn đã đánh giá hệ thống!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop - không cho đóng khi click ngoài */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={(e) => e.stopPropagation()} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">Đánh giá hệ thống MBA Chatbot</h2>
          <p className="text-red-100 text-sm mt-0.5">Phản hồi của bạn giúp chúng tôi cải thiện hệ thống tốt hơn</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Scale legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
            <span className="font-medium">Thang điểm:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="flex items-center gap-1">
                <span className="font-semibold text-gray-700">{n}</span>
                <span>= {SCALE_LABELS[n]}{n < 5 ? ',' : ''}</span>
              </span>
            ))}
          </div>

          {/* Question sections */}
          {QUESTIONS.map((group) => (
            <div key={group.section}>
              <h3 className="font-semibold text-gray-800 text-base mb-3 pb-1 border-b border-red-100">
                {group.section}
              </h3>
              <div className="space-y-4">
                {group.items.map((q) => (
                  <div key={q.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm text-gray-700 flex-1">{q.label}</p>
                    <StarRating
                      value={scores[q.key]}
                      onChange={(v) => setScores((prev) => ({ ...prev, [q.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Suggestion */}
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-2 pb-1 border-b border-red-100">
              5. Góp ý & Đề xuất
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              Bạn có gặp khó khăn gì, hoặc có gợi ý tính năng nào để chúng tôi cải thiện hệ thống tốt hơn không?
            </p>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              rows={4}
              placeholder="Nhập góp ý của bạn tại đây..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-end bg-gray-50 rounded-b-2xl">
          <button
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <FaPaperPlane size={14} />
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingPopup;
