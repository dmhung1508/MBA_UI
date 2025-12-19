import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FileManager from '../components/FileManager';
import AdvancedFileUploader from '../components/AdvancedFileUploader';
import {
  FaUpload,
  FaFile
} from 'react-icons/fa';
import { API_ENDPOINTS } from '../config/api';

const SourceManager = () => {
  const [selectedChatbot, setSelectedChatbot] = useState('');
  const [showAdvancedUploader, setShowAdvancedUploader] = useState(false);
  const [availableChatbots, setAvailableChatbots] = useState([]);
  
  // Teacher permission states
  const [userRole, setUserRole] = useState('');
  const [assignedTopics, setAssignedTopics] = useState([]);
  
  const navigate = useNavigate();

  const colors = {
    primary: '#dc2626',
    secondary: '#ff416c',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  };

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role !== 'admin' && role !== 'teacher') {
      navigate('/mini/');
      return;
    }
    setUserRole(role);
    
    if (role === 'teacher') {
      fetchTeacherTopics();
    } else {
      fetchChatbots();
    }
  }, [navigate]);

  const fetchChatbots = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHATBOTS);
      if (response.ok) {
        const data = await response.json();
        const chatbots = data.chatbots || [];
        setAvailableChatbots(chatbots);
        
        // Auto-select first chatbot
        if (chatbots.length > 0) {
          setSelectedChatbot(chatbots[0].source);
        }
      }
    } catch (err) {
      console.error('Error fetching chatbots:', err);
      // Fallback chatbots
      const fallbackChatbots = [
        { id: 'hung', name: 'Hung Chatbot', source: 'hung' },
        { id: 'admin', name: 'Admin Chatbot', source: 'admin' },
        { id: 'test', name: 'Test Chatbot', source: 'test' }
      ];
      setAvailableChatbots(fallbackChatbots);
      setSelectedChatbot(fallbackChatbots[0].source);
    }
  };

  const fetchTeacherTopics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // First get teacher's assigned topics
      const teacherResponse = await fetch(API_ENDPOINTS.TEACHER_MY_TOPICS, {
        headers
      });
      
      if (teacherResponse.ok) {
        const teacherData = await teacherResponse.json();
        const topics = teacherData.assigned_topics || [];
        setAssignedTopics(topics);
        
        // Then get all chatbots and filter by assigned topics
        const chatbotsResponse = await fetch(API_ENDPOINTS.CHATBOTS);
        if (chatbotsResponse.ok) {
          const chatbotsData = await chatbotsResponse.json();
          const allChatbots = chatbotsData.chatbots || [];
          
          // Filter chatbots to only show assigned topics
          const filteredChatbots = allChatbots.filter(chatbot => 
            topics.includes(chatbot.source)
          );
          
          setAvailableChatbots(filteredChatbots);
          if (filteredChatbots.length > 0) {
            setSelectedChatbot(filteredChatbots[0].source);
          }
        }
      } else {
        console.error('Error fetching teacher topics');
        setAvailableChatbots([]);
      }
    } catch (err) {
      console.error('Error fetching teacher topics:', err);
      setAvailableChatbots([]);
    }
  };


  return (
    <>
      <Navbar />
      <div className="page-container bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
      
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaFile className="w-8 h-8 inline-block align-middle mr-3" style={{ color: colors.primary }} />
                Quản lý File Chatbot
              </h1>
              <p className="text-gray-600">Quản lý file dữ liệu cho chatbot - xem, upload, download, xóa</p>
            </div>
                          <div className="flex space-x-3">
                {/* <button
                  onClick={() => setShowAdvancedUploader(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                >
                  <FaUpload className="mr-2" />
                  Upload File
                </button> */}
              </div>
          </div>

          {/* Chatbot Selector */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Chọn chatbot:</label>
            {availableChatbots.length > 0 ? (
              <select
                value={selectedChatbot}
                onChange={(e) => setSelectedChatbot(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {availableChatbots.map(cb => (
                  <option key={cb.id || cb.source} value={cb.source}>
                    {cb.name} 
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
                {userRole === 'teacher' ? 'Chưa được phân công chatbot nào' : 'Đang tải danh sách chatbot...'}
              </div>
            )}
          </div>
        </div>

        {/* File Manager - Always visible */}
        <FileManager 
          source={selectedChatbot}
          chatbotName={availableChatbots.find(cb => cb.source === selectedChatbot)?.name || selectedChatbot}
        />
      </div>


      {/* Advanced File Uploader Modal */}
      <AdvancedFileUploader 
        isOpen={showAdvancedUploader}
        onClose={() => setShowAdvancedUploader(false)}
        availableChatbots={availableChatbots}
        onUploadSuccess={() => {
          setShowAdvancedUploader(false);
        }}
      />
      </div>
      <Footer />
    </>
  );
};

export default SourceManager; 