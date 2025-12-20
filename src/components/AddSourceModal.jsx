import React, { useState } from 'react';
import { FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';
import { toast } from 'react-toastify';

const AddSourceModal = ({
    isOpen,
    fileId,
    question,
    botAnswer,
    onClose,
    onSuccess
}) => {
    const [newText, setNewText] = useState('');
    const [metadata, setMetadata] = useState({
        category: '',
        description: '',
        tags: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSource = async () => {
        if (!newText.trim()) {
            toast.error('Vui lòng nhập thông tin cần bổ sung');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(API_ENDPOINTS.MBA_UPDATE_CHROMA, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_id: fileId,
                    action: "insert",
                    insert_data: [{
                        text: newText,
                        metadata: {
                            file_name: `user_contribution_${Date.now()}.txt`,
                            file_type: 'text/plain',
                            category: metadata.category || 'User Contribution',
                            description: metadata.description || `Đóng góp bởi người dùng cho câu hỏi: ${question?.substring(0, 100)}`,
                            tags: metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : ['user-contributed'],
                            title: `Thông tin bổ sung - ${new Date().toLocaleDateString('vi-VN')}`,
                            author: 'User'
                        }
                    }]
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Add source successful:', result);
                toast.success('Đã thêm thông tin thành công! Cảm ơn đóng góp của bạn.');

                // Reset form
                setNewText('');
                setMetadata({ category: '', description: '', tags: '' });

                if (onSuccess) onSuccess();
                onClose();
            } else {
                const error = await response.json();
                toast.error(`Không thể thêm thông tin: ${error.detail || 'Lỗi không xác định'}`);
            }
        } catch (error) {
            console.error('Error adding source:', error);
            toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setNewText('');
            setMetadata({ category: '', description: '', tags: '' });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                            <FaPlus className="mr-2 text-green-600" />
                            Đóng góp thông tin
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Bổ sung thông tin chính xác để cải thiện chất lượng chatbot
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Context Info */}
                    {question && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Câu hỏi gốc:</h3>
                            <p className="text-sm text-gray-600 mb-3">{question}</p>

                            {botAnswer && (
                                <>
                                    <h3 className="text-sm font-medium text-gray-700 mb-2">Câu trả lời của bot:</h3>
                                    <p className="text-sm text-gray-600">{botAnswer?.substring(0, 200)}...</p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Main Text Input */}
                    <div className="mb-6">
                        <label htmlFor="newText" className="block text-sm font-medium text-gray-700 mb-2">
                            Thông tin chính xác: <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="newText"
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                            placeholder="Nhập thông tin chính xác về chủ đề này..."
                            disabled={isSubmitting}
                        />
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-sm text-gray-500">{newText.length} ký tự</span>
                            <span className="text-xs text-gray-400">Tối thiểu 50 ký tự</span>
                        </div>
                    </div>

                    {/* Optional Metadata */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Thông tin bổ sung (tùy chọn):</h3>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-600 mb-1">
                                Danh mục:
                            </label>
                            <input
                                id="category"
                                type="text"
                                value={metadata.category}
                                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Ví dụ: Marketing, Chiến lược, Tài chính..."
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">
                                Mô tả ngắn:
                            </label>
                            <input
                                id="description"
                                type="text"
                                value={metadata.description}
                                onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Mô tả ngắn gọn về thông tin này..."
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-600 mb-1">
                                Tags (phân cách bằng dấu phẩy):
                            </label>
                            <input
                                id="tags"
                                type="text"
                                value={metadata.tags}
                                onChange={(e) => setMetadata({ ...metadata, tags: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Ví dụ: chiến lược, digital marketing, ROI"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                    <div className="text-sm text-gray-500">
                        💡 Thông tin của bạn sẽ giúp chatbot trả lời chính xác hơn trong tương lai
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleAddSource}
                            disabled={!newText.trim() || newText.length < 50 || isSubmitting}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && <FaSpinner size={16} className="mr-2 animate-spin" />}
                            <FaPlus size={16} className="mr-2" />
                            {isSubmitting ? 'Đang thêm...' : 'Đóng góp thông tin'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSourceModal;
