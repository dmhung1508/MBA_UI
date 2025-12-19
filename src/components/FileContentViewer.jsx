import React, { useState } from 'react';
import {
  FaTimes,
  FaSpinner,
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaInfoCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../config/api';

const FileContentViewer = ({ isOpen, filename, source, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState('extracted'); // 'extracted' or 'raw'
  const [searchTerm, setSearchTerm] = useState('');

  const getExtractedContent = async () => {
    try {
      setLoading(true);
      
      // Thử API để lấy extracted content từ database
      const response = await fetch(API_ENDPOINTS.MBA_SEARCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          file_id: source,
          query: filename.replace(/^\d{8}_\d{6}_/, ''), // Remove timestamp prefix
          limit: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          // Ghép nội dung từ các chunks
          const extractedText = data.results
            .map((result, index) => `--- Phần ${index + 1} ---\n${result.text}`)
            .join('\n\n');
          
          setContent(extractedText);
          toast.success(`Tìm thấy ${data.results.length} phần nội dung từ file`);
        } else {
          setContent(`📄 File: ${filename}

❌ Không tìm thấy nội dung đã được trích xuất từ file này.

Có thể:
- File chưa được xử lý hoàn tất
- File không chứa text có thể đọc được
- Tên file đã bị thay đổi

💡 Thử click "Xem Raw" để xem dữ liệu gốc hoặc "Tải xuống" để download file.`);
        }
      } else {
        throw new Error('API search failed');
      }
    } catch (err) {
      console.error('Error getting extracted content:', err);
      setContent(`❌ Không thể lấy nội dung đã trích xuất

Lỗi: ${err.message}

💡 Thử:
- Click "Xem Raw" để xem dữ liệu gốc
- Tải xuống file để xem trên máy
- Kiểm tra lại kết nối mạng`);
    } finally {
      setLoading(false);
    }
  };

  const getRawContent = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'accept': 'text/plain'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const encodedFilename = encodeURIComponent(filename);
      const response = await fetch(API_ENDPOINTS.FILE_VIEW(source, encodedFilename), {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const rawContent = await response.text();
        
        // Kiểm tra nếu là PDF raw data
        if (rawContent.startsWith('%PDF') || rawContent.includes('endobj')) {
          setContent(`📄 File PDF Raw Data

⚠️ Đây là dữ liệu thô của file PDF, không thể đọc được.

Dữ liệu gốc (100 ký tự đầu):
${rawContent.substring(0, 100)}...

💡 Để xem nội dung:
- Click "Xem Extracted" để xem nội dung đã được trích xuất
- Hoặc "Tải xuống" để download file PDF gốc`);
        } else {
          setContent(rawContent);
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Error getting raw content:', err);
      setContent(`❌ Không thể lấy dữ liệu raw: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setContent('');
    
    if (mode === 'extracted') {
      getExtractedContent();
    } else {
      getRawContent();
    }
  };

  const highlightSearchTerm = (text) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '**$1**');
  };

  const downloadFile = async () => {
    try {
      toast.info('Đang chuẩn bị tải xuống...');
      
      const token = localStorage.getItem('access_token');
      const headers = {
        'accept': 'application/octet-stream'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const encodedFilename = encodeURIComponent(filename);
      const response = await fetch(API_ENDPOINTS.FILE_VIEW(source, encodedFilename), {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Tải xuống thành công!');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Không thể tải xuống file');
    }
  };

  React.useEffect(() => {
    if (isOpen && filename) {
      getExtractedContent();
    }
  }, [isOpen, filename]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaFileAlt className="w-5 h-5 inline-block align-middle mr-2 text-blue-600" />
              Xem nội dung file
            </h3>
            <p className="text-sm text-gray-500 mt-1 truncate">{filename}</p>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-2 mx-4">
            <button
              onClick={() => handleViewModeChange('extracted')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'extracted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Xem Extracted
            </button>
            <button
              onClick={() => handleViewModeChange('raw')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'raw'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Xem Raw
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadFile}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
              title="Tải xuống"
            >
              <FaDownload className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <FaSearch className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm trong nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info */}
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <FaInfoCircle className="w-3 h-3 inline-block align-middle mr-2" />
            {viewMode === 'extracted'
              ? 'Hiển thị nội dung đã được trích xuất và xử lý từ file'
              : 'Hiển thị dữ liệu thô của file (có thể không đọc được)'
            }
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="w-6 h-6 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">Đang tải nội dung...</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border leading-relaxed">
              {highlightSearchTerm(content) || 'Nội dung trống'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileContentViewer;
