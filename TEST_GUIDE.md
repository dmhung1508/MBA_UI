# 🧪 Hướng Dẫn Test Chức Năng Quản Lý File

## 🚀 Ứng dụng đang chạy tại: `http://localhost:5003/mini/`

## 📝 Các cách test chức năng quản lý file:

### 1. **Test qua AdminDashboard** 
```
URL: http://localhost:5003/mini/admin
```
- Đăng nhập với tài khoản admin
- Chọn tab "Quản lý File" (tab thứ 3)
- Sẽ thấy:
  - Dropdown chọn nguồn chatbot (hung, admin, test)
  - Component FileManager đầy đủ
  - Nút "Test Toast" và "Test API" để kiểm tra

### 2. **Test qua SourceManager**
```
URL: http://localhost:5003/mini/sources
```
- Đăng nhập với tài khoản admin
- Chọn tab "Quản lý File" 
- Sẽ thấy FileManager với đầy đủ chức năng

### 3. **Test riêng biệt**
```
URL: http://localhost:5003/mini/test-file
```
- Trang test chuyên dụng
- Có nút test API metadata và view file
- Hiển thị response JSON đầy đủ
- FileManager component riêng để test

## 🔧 Các chức năng có thể test:

### ✅ **Test Toast Notifications**
- Click "Test Toast" để xem toast hoạt động
- Test success, error, info messages

### ✅ **Test API Metadata**
- Click "Test API" để kiểm tra kết nối API
- Xem response JSON trong console

### ✅ **Test FileManager Component**
- Hiển thị danh sách file từ API
- Tìm kiếm file theo tên
- Click nút "Xem" để xem nội dung file
- Click nút "Upload File" để thêm file mới
- Click nút "Xóa" để xóa file (có confirm)

### ✅ **Test Upload File**
- Hỗ trợ drag & drop
- Kiểm tra loại file (.pdf, .docx, .doc, .txt, .md)
- Kiểm tra kích thước file (tối đa 50MB)
- Progress indicator
- Toast notification khi thành công/thất bại

## 🎯 Điều kiện để test:

1. **Đăng nhập với quyền admin** - Các chức năng này chỉ dành cho admin
2. **API server hoạt động** - `https://mba.ptit.edu.vn/mba_mini/`
3. **Có file trong database** - Nguồn 'hung' cần có ít nhất 1 file để test

## 🔍 Debug Tips:

1. **Mở Developer Console** (F12) để xem:
   - API requests/responses
   - Console logs
   - Error messages

2. **Check Network Tab** để xem:
   - API calls
   - Response status codes
   - Response data

3. **Toast messages** sẽ hiển thị:
   - Thành công: màu xanh lá
   - Lỗi: màu đỏ
   - Thông tin: màu xanh dương

## 🚨 Nếu không thấy nút trong UI:

1. **Kiểm tra đăng nhập**: Phải đăng nhập với tài khoản admin
2. **Kiểm tra URL**: Đảm bảo đang ở đúng trang admin
3. **Refresh page**: Tải lại trang để cập nhật UI
4. **Check browser cache**: Xóa cache nếu cần

## 📋 Checklist Test:

- [ ] Đăng nhập admin thành công
- [ ] Thấy menu "Quản lý File" trong navbar
- [ ] Truy cập được `/mini/admin` và thấy tab "Quản lý File"
- [ ] Truy cập được `/mini/sources` và thấy tab "Quản lý File"  
- [ ] Test API metadata thành công
- [ ] Hiển thị danh sách file
- [ ] Test view file thành công
- [ ] Test upload file thành công
- [ ] Toast notifications hoạt động
- [ ] Confirm delete modal hiển thị

Nếu có vấn đề gì, hãy check console để xem error message!
