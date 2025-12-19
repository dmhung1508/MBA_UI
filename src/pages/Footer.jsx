import React, { memo } from "react";
import {
  FaRobot,
  FaFacebook,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaGithub,
  FaTwitter,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                <FaRobot className="text-white text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">TA Chatbot</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Trợ lý AI thông minh hỗ trợ sinh viên của PTIT 24/7.
              Giải đáp thắc mắc về chương trình học, môn học và thông tin học vụ.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Liên hệ</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-red-600 mt-1 mr-3 flex-shrink-0" />
                <span className="text-gray-600 text-sm">
                  Km10, Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội
                </span>
              </div>
              <div className="flex items-center">
                <FaPhone className="text-red-600 mr-3 flex-shrink-0" />
                <a href="tel:02437562186" className="text-gray-600 text-sm hover:text-red-600 transition-colors">
                  024 3756 2186
                </a>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="text-red-600 mr-3 flex-shrink-0" />
                <a href="mailto:ctsv@ptit.edu.vn" className="text-gray-600 text-sm hover:text-red-600 transition-colors">
                  ctsv@ptit.edu.vn
                </a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Kết nối</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/HocvienPTIT"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                aria-label="Facebook"
              >
                <FaFacebook size={18} />
              </a>
            </div>
            <p className="text-gray-600 text-sm">
              Theo dõi chúng tôi để cập nhật thông tin mới nhất
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col justify-center items-center space-y-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                © 2025 TA Chatbot - PTIT. Bảo lưu mọi quyền.
              </p>
            </div>
            {/* <div className="flex items-center space-x-6 text-sm">
              <a href="/chat/privacy" className="text-gray-600 hover:text-red-600 transition-colors">
                Chính sách bảo mật
              </a>
              <a href="/chat/terms" className="text-gray-600 hover:text-red-600 transition-colors">
                Điều khoản sử dụng
              </a>
              <a href="/chat/support" className="text-gray-600 hover:text-red-600 transition-colors">
                Hỗ trợ
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);