import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FileManager from '../components/FileManager';
import { toast } from 'react-toastify';

const TestPage = () => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);

  const testMetadataAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mba.ptit.edu.vn/mba_mini/files/hung/metadata', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      setMetadata(data);
      toast.success(`API hoạt động! Tìm thấy ${data.metadata.files.length} files`);
    } catch (error) {
      console.error('API Error:', error);
      toast.error(`Lỗi API: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testViewFile = async () => {
    if (!metadata || !metadata.metadata.files.length) {
      toast.error('Không có file để test');
      return;
    }

    const firstFile = metadata.metadata.files[0];
    setLoading(true);
    
    try {
      const encodedFilename = encodeURIComponent(firstFile.filename);
      const response = await fetch(`https://mba.ptit.edu.vn/mba_mini/files/hung/view/${encodedFilename}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      let content;
      
      if (contentType && contentType.includes('application/json')) {
        content = await response.json();
      } else {
        content = await response.text();
      }

      console.log('File content:', content);
      toast.success('Xem file thành công!');
    } catch (error) {
      console.error('View File Error:', error);
      toast.error(`Lỗi xem file: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testMetadataAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Test Trang Quản Lý File</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testMetadataAPI}
              disabled={loading}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Testing...' : 'Test Metadata API'}
            </button>
            
            <button
              onClick={testViewFile}
              disabled={loading || !metadata}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Testing...' : 'Test View File API'}
            </button>
          </div>

          {metadata && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2">Metadata API Response:</h3>
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">FileManager Component Test</h2>
          <FileManager source="hung" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TestPage;
