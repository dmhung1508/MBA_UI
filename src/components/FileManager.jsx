import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFile, 
  faFileAlt, 
  faFilePdf, 
  faFileWord,
  faDownload,
  faEye,
  faTrash,
  faUpload,
  faSearch,
  faCalendar,
  faHdd,
  faRefresh,
  faExclamationTriangle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import FileUploader from './FileUploader';
import FileContentViewer from './FileContentViewer';
import { fetchWithAuth } from '../utils/auth';

const FileManager = ({ source = 'hung', chatbotName = '' }) => {
  const [metadata, setMetadata] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerContent, setViewerContent] = useState('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, file: null });
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [selectedFileForViewing, setSelectedFileForViewing] = useState(null);

  useEffect(() => {
    fetchFileMetadata();
  }, [source]);

  const fetchFileMetadata = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetchWithAuth(`https://api.dinhmanhhung.net/auth_mini/mba/files/${source}/metadata`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        // Nếu lỗi 404, chỉ để trống danh sách file (chưa có file)
        if (response.status === 404) {
          setMetadata({ files: [], total_files: 0 });
          setFiles([]);
          setLoading(false);
          return;
        }
        
        // Parse error message để kiểm tra lỗi thư mục không tồn tại
        try {
          const errorData = await response.json();
          if (errorData.detail && errorData.detail.includes('không tồn tại')) {
            // Thư mục chưa được tạo, không hiển thị lỗi
            setMetadata({ files: [], total_files: 0 });
            setFiles([]);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMetadata(data.metadata);
      setFiles(data.metadata.files || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
      
      // Không hiển thị lỗi, chỉ để trống danh sách file (hiển thị "Chưa có file nào")
      setMetadata({ files: [], total_files: 0 });
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const viewFile = async (filename) => {
    try {
      setViewerLoading(true);
      setSelectedFile(filename);
      setShowViewer(true);
      setViewerContent(''); // Reset content
      
      const encodedFilename = encodeURIComponent(filename);
      const fileExtension = filename.toLowerCase().split('.').pop();
      
      // Thêm timeout để tránh lag
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
      
      let content = '';
      
      // Kiểm tra loại file để xử lý phù hợp
      if (fileExtension === 'pdf') {
        // Đối với file PDF, hiển thị thông báo thay vì raw data
        content = `📄 File PDF: ${filename}

⚠️ File PDF không thể hiển thị trực tiếp dưới dạng text.

Để xem nội dung PDF:
1. Click nút "Tải xuống" để download file
2. Mở file bằng PDF reader
3. Hoặc sử dụng công cụ chuyển đổi PDF sang text

📊 Thông tin file:
- Tên: ${filename}
- Loại: PDF Document
- Nguồn: ${source}

💡 Lưu ý: File PDF đã được xử lý và đưa vào cơ sở dữ liệu để chatbot có thể trả lời câu hỏi dựa trên nội dung.`;
        
      } else {
        // Đối với file text, docx, md... thử lấy nội dung
        const response = await fetchWithAuth(`https://api.dinhmanhhung.net/auth_mini/mba/files/${source}/view/${encodedFilename}`, {
          method: 'GET',
          headers: {
            'accept': 'text/plain'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Kiểm tra content-type để xử lý phù hợp
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          content = JSON.stringify(data, null, 2);
        } else {
          content = await response.text();
          
          // Kiểm tra nếu content là binary data (như PDF raw)
          if (content.startsWith('%PDF') || content.includes('endobj') || content.includes('/Filter')) {
            content = `📄 File: ${filename}

⚠️ File này chứa dữ liệu binary hoặc đã được mã hóa và không thể hiển thị trực tiếp dưới dạng text.

Để xem nội dung:
1. Click nút "Tải xuống" để download file
2. Mở file bằng ứng dụng phù hợp

💡 File đã được xử lý và đưa vào cơ sở dữ liệu để chatbot có thể sử dụng.`;
          }
        }
      }
      
      // Kiểm tra nếu content quá dài (> 100KB) thì cắt bớt
      if (content.length > 100000) {
        content = content.substring(0, 100000) + '\n\n... (Nội dung bị cắt để tránh lag. File quá dài để hiển thị đầy đủ)';
      }
      
      setViewerContent(content);
      
    } catch (err) {
      console.error('Error viewing file:', err);
      
      if (err.name === 'AbortError') {
        setViewerContent('Timeout: File quá lớn hoặc mạng chậm. Vui lòng thử lại.');
        toast.error('Timeout khi tải file');
      } else {
        setViewerContent(`❌ Không thể tải nội dung file: ${filename}

Có thể do:
- File không hỗ trợ xem trực tiếp
- File quá lớn hoặc bị lỗi
- Kết nối mạng không ổn định

💡 Thử:
- Click "Tải xuống" để download file
- Kiểm tra lại kết nối mạng
- Liên hệ admin nếu vấn đề vẫn tiếp tục`);
        toast.error('Không thể xem file');
      }
    } finally {
      setViewerLoading(false);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case '.pdf':
        return faFilePdf;
      case '.docx':
      case '.doc':
        return faFileWord;
      case '.txt':
      case '.md':
        return faFileAlt;
      default:
        return faFile;
    }
  };

  const getFileIconColor = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case '.pdf':
        return 'text-red-600';
      case '.docx':
      case '.doc':
        return 'text-blue-600';
      case '.txt':
      case '.md':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const filteredFiles = files.filter(file => 
    file.filename?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeViewer = () => {
    setShowViewer(false);
    setSelectedFile(null);
    setViewerContent('');
  };

  const handleUploadSuccess = () => {
    fetchFileMetadata();
    setShowUploader(false);
  };

  const deleteFile = async (filename) => {
    try {
      const encodedFilename = encodeURIComponent(filename);
      const response = await fetchWithAuth(`https://api.dinhmanhhung.net/auth_mini/mba/files/${source}/by-filename/${encodedFilename}?delete_original_file=true`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Delete result:', result);
      
      if (result.status === 'success') {
        toast.success(`Xóa thành công! ${result.message}`);
      } else {
        toast.success('Xóa file thành công!');
      }
      
      fetchFileMetadata();
      setDeleteConfirm({ show: false, file: null });
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Không thể xóa file. Vui lòng thử lại.');
    }
  };

  const confirmDelete = (file) => {
    setDeleteConfirm({ show: true, file });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, file: null });
  };

  const downloadFile = async (filename) => {
    try {
      toast.info('Đang chuẩn bị tải xuống...');
      
      const encodedFilename = encodeURIComponent(filename);
      const response = await fetchWithAuth(`https://api.dinhmanhhung.net/auth_mini/mba/files/${source}/view/${encodedFilename}`, {
        method: 'GET',
        headers: {
          'accept': 'application/octet-stream'
        }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600">Đang tải danh sách file...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              <FontAwesomeIcon icon={faFile} className="mr-3 text-red-600" />
              Quản lý File Chatbot
            </h2>
            <p className="text-gray-600">
              Nguồn: <span className="font-semibold text-gray-800">{chatbotName || source}</span>
            </p>
            {metadata && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCalendar} className="mr-2 text-gray-500" />
                  <span>Cập nhật: {formatDate(metadata.last_upload_date)}</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faFile} className="mr-2 text-gray-500" />
                  <span>Tổng files: {files.length}</span>
                </div>
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faHdd} className="mr-2 text-gray-500" />
                  <span>
                    Dung lượng: {formatFileSize(files.reduce((total, file) => total + (file.size_bytes || 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              Upload File
            </button>
            <button
              onClick={fetchFileMetadata}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <FontAwesomeIcon icon={faRefresh} className="mr-2" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Lỗi</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <FontAwesomeIcon icon={faFile} className="text-gray-300 text-4xl mb-4" />
          <h3 className="text-gray-500 text-lg font-medium mb-2">
            {files.length === 0 ? 'Chưa có file nào' : 'Không tìm thấy file phù hợp'}
          </h3>
          <p className="text-gray-400">
            {files.length === 0 
              ? 'Upload file đầu tiên để bắt đầu sử dụng chatbot'
              : 'Thử thay đổi từ khóa tìm kiếm'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kích thước
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày upload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FontAwesomeIcon 
                          icon={getFileIcon(file.file_type)} 
                          className={`mr-3 text-lg ${getFileIconColor(file.file_type)}`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 max-w-md truncate">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.filepath}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        file.file_type === '.pdf' ? 'bg-red-100 text-red-800' :
                        file.file_type === '.docx' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {file.file_type?.replace('.', '').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(file.size_bytes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(file.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFileForViewing(file.filename);
                            setShowContentViewer(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-100 transition-colors"
                          title="Xem file"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          onClick={() => downloadFile(file.filename)}
                          className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-100 transition-colors"
                          title="Tải xuống"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        <button
                          onClick={() => confirmDelete(file)}
                          className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-100 transition-colors"
                          title="Xóa file"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {showViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeViewer}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Xem nội dung file</h3>
                <p className="text-sm text-gray-500 mt-1">{selectedFile}</p>
              </div>
              <button
                onClick={closeViewer}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {viewerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">Đang tải nội dung...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border">
                  {viewerContent || 'Nội dung trống'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Uploader Modal */}
      <FileUploader 
        isOpen={showUploader}
        onClose={() => setShowUploader(false)}
        source={source}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Advanced File Content Viewer */}
      <FileContentViewer 
        isOpen={showContentViewer}
        filename={selectedFileForViewing}
        source={source}
        onClose={() => {
          setShowContentViewer(false);
          setSelectedFileForViewing(null);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={cancelDelete}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-2xl mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa file</h3>
              </div>
              <p className="text-gray-600 mb-2">
                Bạn có chắc chắn muốn xóa file này không?
              </p>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded text-gray-800 mb-6">
                {deleteConfirm.file?.filename}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteFile(deleteConfirm.file.filename)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
