import React, { useState } from 'react';
import { FaTimes, FaPaperPlane, FaExclamationCircle, FaImage, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';

const TicketModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'question'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types (images only)
    const validFiles = files.filter(file => file.type.startsWith('image/'));

    if (validFiles.length !== files.length) {
      toast.warning('Chỉ chấp nhận file ảnh');
    }

    // Limit to 5 files
    if (attachments.length + validFiles.length > 5) {
      toast.error('Tối đa 5 file ảnh');
      return;
    }

    // Add preview URLs
    const filesWithPreview = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));

    setAttachments([...attachments, ...filesWithPreview]);
  };

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    // Revoke the object URL to free memory
    URL.revokeObjectURL(attachments[index].preview);
    setAttachments(newAttachments);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Vui lòng nhập mô tả');
      return;
    }
    if (formData.title.length > 200) {
      toast.error('Tiêu đề không được quá 200 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');

      // Step 1: Create the ticket
      const response = await fetch(API_ENDPOINTS.TICKET_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.detail || 'Không thể tạo ticket');
        return;
      }

      const result = await response.json();
      const ticketNumber = result.ticket_number;

      // Step 2: Upload attachments if any
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', attachment.file);
          uploadFormData.append('ticket_id', ticketNumber);

          try {
            const uploadResponse = await fetch(API_ENDPOINTS.TICKET_UPLOAD_ATTACHMENT, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'accept': 'application/json'
              },
              body: uploadFormData
            });

            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              console.error('Upload failed:', errorText);
            }
          } catch (uploadError) {
            console.error('Error uploading attachment:', uploadError);
            // Continue with other attachments even if one fails
          }
        }
      }

      toast.success(`Đã tạo ticket ${ticketNumber} thành công!`);
      setFormData({ title: '', description: '', type: 'question' });
      setAttachments([]);

      // Clean up preview URLs
      attachments.forEach(att => URL.revokeObjectURL(att.preview));

      onSuccess?.();
      onClose();

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center">
            <FaExclamationCircle className="text-white text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-white">Tạo yêu cầu hỗ trợ</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Tóm tắt vấn đề của bạn..."
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/200 ký tự
              </p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại yêu cầu <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="question">Câu hỏi</option>
                <option value="bug">Báo lỗi</option>
                <option value="feature_request">Yêu cầu tính năng</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả chi tiết <span className="text-red-600">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh đính kèm (tối đa 5 ảnh)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors flex items-center gap-2">
                  <FaImage className="text-gray-600" />
                  <span className="text-sm text-gray-700">Chọn ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-gray-500">
                  {attachments.length}/5 ảnh
                </span>
              </div>

              {/* Preview attachments */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={attachment.preview}
                        alt={attachment.name}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTrash size={10} />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{attachment.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi...
              </>
            ) : (
              <>
                <FaPaperPlane className="mr-2" />
                Gửi yêu cầu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketModal;
