import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  FaUpload,
  FaTimes,
  FaCloudUploadAlt,
  FaFileAlt,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const FileUploader = ({ isOpen, onClose, source = 'hung', onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStep, setUploadStep] = useState('');

  const acceptedFileTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown'
  ];

  const acceptedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];

  const handleFileSelect = (file) => {
    if (!file) return;

    // Kiểm tra loại file
    if (!acceptedFileTypes.includes(file.type) && !acceptedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      toast.error('Loại file không được hỗ trợ. Chỉ chấp nhận: PDF, DOCX, DOC, TXT, MD');
      return;
    }

    // Kiểm tra kích thước file (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File quá lớn. Kích thước tối đa là 50MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file để upload');
      return;
    }

    setUploading(true);
    setUploadStep('Đang chuẩn bị upload file...');

    try {
      const token = localStorage.getItem('access_token');
      const headers = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      setUploadStep('Đang upload file lên server...');

      const formData = new FormData();
      formData.append('file_id', source); // Sử dụng file_id thay vì source
      formData.append('files', selectedFile); // Sử dụng files thay vì file

      const response = await fetch(API_ENDPOINTS.FILE_UPLOAD, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      setUploadStep('Đang xử lý file và trích xuất nội dung...');

      const result = await response.json();
      console.log('Upload successful:', result);

      setUploadStep('Đang embedding vào cơ sở dữ liệu...');

      // Giả lập delay để user thấy step
      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadStep('Hoàn thành! ✓');

      toast.success(`Upload thành công! ${result.message || 'File đã được tải lên'}`);

      // Reset form
      setSelectedFile(null);
      setUploadStep('');

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
      setUploadStep('');
      toast.error(`Upload thất bại: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>

      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
            <p className="text-sm text-gray-500 mt-1">
              Nguồn: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{source}</code>
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
        <div className="p-6">
          {/* File Drop Zone */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
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
                Hỗ trợ: PDF, DOCX, DOC, TXT, MD (tối đa 50MB)
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc,.txt,.md"
                className="hidden"
                id="file-input"
                disabled={uploading}
              />
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <FaFileAlt className="w-4 h-4 inline-block align-middle mr-2" />
                Chọn File
              </label>
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaFileAlt className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-100 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                )}
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-center text-blue-600 mb-2">
                    <FaSpinner className="w-4 h-4 animate-spin inline-block align-middle mr-2" />
                    <span className="font-medium">{uploadStep}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse transition-all" style={{ width: '60%' }}></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    {uploadStep.includes('chuẩn bị') && 'Bước 1/4'}
                    {uploadStep.includes('upload file') && 'Bước 2/4'}
                    {uploadStep.includes('xử lý') && 'Bước 3/4'}
                    {uploadStep.includes('embedding') && 'Bước 4/4'}
                    {uploadStep.includes('Hoàn thành') && 'Hoàn tất'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="w-4 h-4 text-blue-600 mt-1 mr-3" />
              <div>
                <h4 className="font-medium text-blue-900">Lưu ý khi upload file:</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• File sẽ được xử lý và đưa vào cơ sở dữ liệu chatbot</li>
                  <li>• Quá trình xử lý có thể mất vài phút đối với file lớn</li>
                  <li>• File sẽ có sẵn để trả lời câu hỏi sau khi xử lý xong</li>
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
            onClick={uploadFile}
            disabled={!selectedFile || uploading}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading && <FaSpinner className="w-4 h-4 animate-spin inline-block align-middle mr-2" />}
            <FaUpload className="w-4 h-4 inline-block align-middle mr-2" />
            {uploading ? 'Đang upload...' : 'Upload File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
