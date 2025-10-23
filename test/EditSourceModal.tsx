import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Source } from '../../types';

interface EditSourceModalProps {
  isOpen: boolean;
  source: Source | null;
  fileId: string;
  onClose: () => void;
  onSave: () => void;
}

const EditSourceModal: React.FC<EditSourceModalProps> = ({
  isOpen,
  source,
  fileId,
  onClose,
  onSave
}) => {
  const [editText, setEditText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (source) {
      setEditText(source.text);
    }
  }, [source]);

  const handleUpdateSource = async () => {
    if (!source || !editText.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch('http://localhost:4554/party_api/update-chroma', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_id: fileId,
          action: "update",
          document_ids: [source.id],
          update_data: {
            text: editText
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Update successful:', result);
        onSave();
        onClose();
      } else {
        console.error('Update failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating source:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (!isUpdating) {
      setEditText(source?.text || '');
      onClose();
    }
  };

  if (!isOpen || !source) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chỉnh sửa nguồn</h2>
              <p className="text-sm text-gray-500 mt-1">{source.file_name}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Source Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-700">Loại file:</span>
                <span className="ml-2 text-sm text-gray-600">{source.file_type}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Ngày tạo:</span>
                <span className="ml-2 text-sm text-gray-600">{source.creation_date}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Độ chính xác:</span>
                <span className="ml-2 text-sm text-gray-600">{(source.score * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Kích thước:</span>
                <span className="ml-2 text-sm text-gray-600">
                  {source.file_size > 0 ? `${(source.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Edit Text Area */}
            <div className="mb-6">
              <label htmlFor="editText" className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung:
              </label>
              <textarea
                id="editText"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Nhập nội dung..."
                disabled={isUpdating}
              />
              <div className="mt-2 text-sm text-gray-500">
                {editText.length} ký tự
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdateSource}
              disabled={!editText.trim() || isUpdating}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating && <Loader2 size={16} className="mr-2 animate-spin" />}
              <Save size={16} className="mr-2" />
              {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditSourceModal; 