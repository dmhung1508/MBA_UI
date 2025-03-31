import React from "react";
import {
  FaRobot,
  FaFacebook,
  FaYoutube,
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-red-600">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1 - About */}
          <div className="text-white">
            <div className="flex items-center mb-4">
              <FaRobot className="mr-2 text-2xl" />
              <h3 className="text-xl font-bold">PTIT Chatbot</h3>
            </div>
            <p className="text-sm">
              PTIT Chatbot là trợ lý ảo thông minh hỗ trợ sinh viên và học viên
              của Học viện Công nghệ Bưu chính Viễn thông
            </p>
          </div>

          {/* Column 2 - Contact */}
          <div className="text-white">
            <h3 className="text-xl font-bold mb-4">Thông tin liên hệ</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                <p className="text-sm">Km10, Đường Nguyễn Trãi, Q. Hà Đông, Hà Nội</p>
              </div>
              <div className="flex items-center">
                <FaPhone className="mr-2" />
                <p className="text-sm">024 3756 2186</p>
              </div>
              <div className="flex items-center">
                <FaEnvelope className="mr-2" />
                <p className="text-sm">ctsv@ptit.edu.vn</p>
              </div>
            </div>
          </div>

          {/* Column 3 - Social Links */}
          <div className="text-white">
            <h3 className="text-xl font-bold mb-4">Trang mạng xã hội</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/@HocvienPTIT"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-300 transition transform hover:scale-110"
              >
                <FaFacebook size={24} />
              </a>
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-300 transition transform hover:scale-110"
              >
                <FaYoutube size={24} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="mt-8 pt-4 border-t border-red-500">
          <p className="text-center text-white text-sm">
            © 2024 PTIT Chatbot. Bảo lưu mọi quyền.
            <br />
            Một sản phẩm của IEC PTIT.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;