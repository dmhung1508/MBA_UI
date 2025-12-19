import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  FaUpload,
  FaTimes,
  FaCloudUploadAlt,
  FaFileAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFile,
  FaRobot
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdvancedFileUploader = ({ isOpen, onClose, availableChatbots = [], onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const acceptedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ];

  const acceptedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];

  const handleFilesSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      // Kiểm tra loại file
      if (!acceptedFileTypes.includes(file.type) && !acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
        errors.push(`${file.name}: Loại file không được hỗ trợ`);
        return;
      }

      // Kiểm tra kích thước file (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`${file.name}: File quá lớn (tối đa 50MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast.error(`Một số file không hợp lệ:\n${errors.join('\n')}`);
    }

    setSelectedFiles([...selectedFiles, ...validFiles]);
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFilesSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFiles = async () => {
    if (!selectedSource) {
      toast.error('Vui lòng chọn chatbot để tải dữ liệu');
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file để tải lên');
      return;
    }

    setUploading(true);
    setUploadProgress('Đang tải lên...');
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const formData = new FormData();
      formData.append('file_id', selectedSource);
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể tải lên file');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      toast.success(`Đã tải lên thành công! ${result.message || `${selectedFiles.length} file(s) đã được upload`}`);
      
      // Reset form
      setSelectedFiles([]);
      setSelectedSource('');
      setUploadProgress('');
      
      // Callback để refresh danh sách file
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
      // Đóng modal sau 1 giây
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload thất bại: ${error.message}`);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setSelectedSource('');
      setUploadProgress('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tải dữ liệu cho Chatbot</h2>
            <p className="text-sm text-gray-500 mt-1">
              Upload file dữ liệu để training cho các chatbot
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Select Chatbot */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <FaRobot className="w-4 h-4 inline-block align-middle mr-2" />
              Chọn Chatbot
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={uploading}
            >
              <option value="">-- Chọn chatbot để tải dữ liệu --</option>
              {availableChatbots.map((chatbot) => (
                <option key={chatbot.id || chatbot.source} value={chatbot.source}>
                  {chatbot.name} (Nguồn: {chatbot.source})
                </option>
              ))}
              {/* Fallback options nếu không có chatbots */}
              {availableChatbots.length === 0 && (
                <>
                  <option value="hung">Hung Chatbot (Nguồn: hung)</option>
                  <option value="admin">Admin Chatbot (Nguồn: admin)</option>
                  <option value="test">Test Chatbot (Nguồn: test)</option>
                </>
              )}
            </select>
          </div>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${
              dragOver
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FaCloudUploadAlt
              className={`w-16 h-16 mx-auto mb-4 ${dragOver ? 'text-red-500' : 'text-gray-400'}`}
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Kéo thả file vào đây hoặc click để chọn
            </h3>
            <p className="text-gray-500 mb-4">
              Hỗ trợ nhiều file: PDF, DOCX, DOC, TXT, MD (tối đa 50MB mỗi file)
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.md"
              className="hidden"
              id="file-input-advanced"
              disabled={uploading}
            />
            <label
              htmlFor="file-input-advanced"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              <FaFileAlt className="w-4 h-4 inline-block align-middle mr-2" />
              Chọn File
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-700 mb-3">File đã chọn ({selectedFiles.length}):</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <FaFile className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors"
                      >
                        <FaTimes className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FaSpinner className="w-5 h-5 animate-spin text-blue-600 mr-3" />
                <span className="text-blue-700">{uploadProgress}</span>
              </div>
            </div>
          )}

          {/* Upload Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="w-4 h-4 text-blue-600 mt-1 mr-3" />
              <div>
                <h4 className="font-medium text-blue-900">Lưu ý khi upload file:</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• File sẽ được xử lý và đưa vào cơ sở dữ liệu chatbot</li>
                  <li>• Quá trình xử lý có thể mất vài phút đối với file lớn</li>
                  <li>• File sẽ có sẵn để trả lời câu hỏi sau khi xử lý xong</li>
                  <li>• Có thể upload nhiều file cùng lúc để tiết kiệm thời gian</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={uploadFiles}
            disabled={!selectedSource || selectedFiles.length === 0 || uploading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <FaSpinner className="w-4 h-4 animate-spin inline-block align-middle mr-2" />}
            <FaUpload className="w-4 h-4 inline-block align-middle mr-2" />
            {uploading ? 'Đang upload...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFileUploader;
