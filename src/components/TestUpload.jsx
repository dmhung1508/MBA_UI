import React, { useState } from 'react';
import { toast } from 'react-toastify';

const TestUpload = () => {
  const [loading, setLoading] = useState(false);

  const testToast = () => {
    toast.success('Test thành công! Toast hoạt động');
    toast.error('Test lỗi! Toast hoạt động');
    toast.info('Test thông tin! Toast hoạt động');
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://mba.ptit.edu.vn/mba_mini/files/hung/metadata');
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        toast.success(`Lấy metadata thành công! ${data.metadata.files.length} files`);
      } else {
        toast.error('Lỗi API');
      }
    } catch (error) {
      toast.error('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Test Components</h3>
      <div className="space-x-4">
        <button
          onClick={testToast}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Toast
        </button>
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>
    </div>
  );
};

export default TestUpload;
