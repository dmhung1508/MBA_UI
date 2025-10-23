# Tính năng Quản lý Logs cho Admin

## Tổng quan

Tính năng quản lý logs được tích hợp vào giao diện admin, cho phép admin xem, lọc, thống kê và dọn dẹp logs hoạt động của admin và teacher trong hệ thống MBA Backend Mini.

## Truy cập

- **URL**: `/mini/logs`
- **Quyền truy cập**: Chỉ admin
- **Menu**: Quản trị → Quản lý Logs (trong navbar)

## Tính năng chính

### 1. Tab Danh sách Logs

#### Bộ lọc mạnh mẽ
- **Username**: Tìm kiếm theo username (hỗ trợ regex)
- **Role**: Lọc theo vai trò (admin/teacher)
- **Action**: Lọc theo hành động (CREATE/UPDATE/DELETE/VIEW)
- **Resource Type**: Lọc theo loại tài nguyên (QUESTION/USER/CHATBOT/TOPIC/LOG)
- **From Date**: Lọc từ ngày
- **To Date**: Lọc đến ngày

#### Hiển thị thông tin log
Mỗi log hiển thị:
- **Thời gian**: Thời điểm thực hiện hành động
- **User**: Username và role của người thực hiện
- **Action**: Loại hành động với màu sắc phân biệt:
  - CREATE: Xanh lá
  - UPDATE: Xanh dương
  - DELETE: Đỏ
  - VIEW: Xám
- **Resource**: Loại tài nguyên và ID
- **Details**: 
  - Trạng thái (success/error)
  - Tóm tắt kết quả
  - Endpoint và method
- **IP Address**: Địa chỉ IP của người thực hiện

#### Phân trang
- Điều hướng qua các trang logs
- Hiển thị tổng số logs và số trang
- Có thể chuyển trang nhanh với nút Previous/Next

### 2. Tab Thống kê

#### Chọn khoảng thời gian
- 1 ngày qua
- 7 ngày qua
- 30 ngày qua
- 90 ngày qua
- 365 ngày qua

#### Các thống kê hiển thị
1. **Tổng quan**:
   - Tổng số logs trong khoảng thời gian
   - Khoảng thời gian thống kê

2. **Theo Action**:
   - Số lượng logs cho mỗi loại action (CREATE/UPDATE/DELETE/VIEW)

3. **Theo Resource Type**:
   - Số lượng logs cho mỗi loại tài nguyên

4. **Theo User**:
   - Số lượng logs của từng user
   - Hiển thị username và role

5. **Theo Ngày**:
   - Biểu đồ logs theo từng ngày
   - Dễ dàng nhìn thấy xu hướng hoạt động

### 3. Dọn dẹp Logs cũ

#### Tính năng cleanup
- Xóa logs cũ hơn số ngày chỉ định
- Giới hạn: 30-365 ngày
- Modal xác nhận trước khi xóa
- Cảnh báo hành động không thể hoàn tác

#### Quy trình
1. Nhấn nút "Dọn dẹp Logs" ở góc phải header
2. Chọn số ngày (logs cũ hơn sẽ bị xóa)
3. Xác nhận xóa
4. Hệ thống thông báo số lượng logs đã xóa

## API Endpoints được sử dụng

### 1. Lấy danh sách logs
```
GET /admin/logs
```
**Query Parameters:**
- `offset`: Vị trí bắt đầu (mặc định: 0)
- `limit`: Số lượng logs (mặc định: 20, tối đa: 100)
- `username`: Lọc theo username
- `role`: Lọc theo role (admin/teacher)
- `action`: Lọc theo action
- `resource_type`: Lọc theo resource type
- `from_date`: Từ ngày (YYYY-MM-DD)
- `to_date`: Đến ngày (YYYY-MM-DD)

**Response:**
```json
{
  "total_logs": 150,
  "logs": [...],
  "pagination": {
    "offset": 0,
    "limit": 20,
    "total": 150,
    "has_more": true,
    "current_page": 1,
    "total_pages": 8
  }
}
```

### 2. Lấy thống kê logs
```
GET /admin/logs/stats
```
**Query Parameters:**
- `days`: Số ngày thống kê (1-365)

**Response:**
```json
{
  "period": "Last 7 days",
  "from_date": "2024-01-08T00:00:00Z",
  "to_date": "2024-01-15T10:30:00Z",
  "total_logs": 45,
  "statistics": {
    "by_action": [...],
    "by_resource_type": [...],
    "by_user": [...],
    "by_day": [...]
  }
}
```

### 3. Dọn dẹp logs cũ
```
DELETE /admin/logs/cleanup
```
**Query Parameters:**
- `days`: Xóa logs cũ hơn N ngày (30-365)

**Response:**
```json
{
  "message": "Đã xóa 1250 logs cũ hơn 90 ngày",
  "cutoff_date": "2023-10-15T00:00:00Z",
  "deleted_count": 1250
}
```

## Cấu trúc Component

### AdminLogs.jsx
**Location**: `/src/pages/AdminLogs.jsx`

**States chính**:
- `logs`: Danh sách logs hiện tại
- `stats`: Dữ liệu thống kê
- `filters`: Các bộ lọc đang áp dụng
- `pagination`: Thông tin phân trang
- `activeTab`: Tab đang được chọn (logs/stats)
- `showCleanupModal`: Hiển thị modal cleanup

**Functions chính**:
- `fetchLogs()`: Lấy danh sách logs với filters
- `fetchStats()`: Lấy thống kê logs
- `handleCleanup()`: Xóa logs cũ
- `handleFilterChange()`: Cập nhật filter
- `handlePageChange()`: Chuyển trang

## UI/UX

### Màu sắc
- Primary: Red (#dc2626)
- Success: Green (#10b981)
- Warning: Yellow/Orange (#f59e0b)
- Danger: Red (#ef4444)

### Icons (FontAwesome)
- `faClipboardList`: Icon chính cho logs
- `faFilter`: Bộ lọc
- `faChartBar`: Thống kê
- `faTrash`: Xóa/Cleanup
- `faSync`: Làm mới
- `faSearch`: Tìm kiếm
- `faCalendar`: Ngày tháng
- `faUser`: User
- `faTag`: Tag/Label
- `faBox`: Resource

### Responsive Design
- Desktop: Layout đầy đủ với tất cả thông tin
- Tablet: Bảng log có thể scroll ngang
- Mobile: Tối ưu cho màn hình nhỏ

## Bảo mật

- Kiểm tra quyền admin khi component mount
- Redirect về home page nếu không phải admin
- Token được gửi trong Authorization header cho mọi request
- Xác nhận hai lần trước khi cleanup logs

## Tích hợp với hệ thống

### Navbar
- Thêm link "Quản lý Logs" vào menu dropdown "Quản trị" (chỉ admin)
- Hiển thị cả desktop và mobile menu

### Routing
- Route: `/mini/logs`
- Protected route (yêu cầu đăng nhập)
- Kiểm tra role admin trong component

## Các tính năng nổi bật

1. **Lọc linh hoạt**: Kết hợp nhiều điều kiện lọc
2. **Thống kê trực quan**: Dễ dàng nắm bắt xu hướng
3. **Phân trang hiệu quả**: Xử lý lượng lớn logs
4. **UI thân thiện**: Màu sắc phân biệt, icon rõ ràng
5. **Cleanup an toàn**: Xác nhận và giới hạn ngày

## Hướng dẫn sử dụng

### Xem logs
1. Đăng nhập với tài khoản admin
2. Vào menu "Quản trị" → "Quản lý Logs"
3. Sử dụng bộ lọc để tìm logs cần thiết
4. Nhấn "Áp dụng" để lọc

### Xem thống kê
1. Chuyển sang tab "Thống kê"
2. Chọn khoảng thời gian muốn xem
3. Nhấn "Tải thống kê"
4. Xem các biểu đồ thống kê

### Dọn dẹp logs
1. Nhấn nút "Dọn dẹp Logs" ở header
2. Nhập số ngày (logs cũ hơn sẽ bị xóa)
3. Nhấn "Xóa" và xác nhận
4. Kiểm tra thông báo kết quả

## Khuyến nghị

### Performance
- Nên thường xuyên cleanup logs cũ (mỗi 3-6 tháng)
- Sử dụng bộ lọc để giảm số lượng logs hiển thị
- Tăng limit nếu muốn xem nhiều logs hơn (tối đa 100)

### Bảo mật
- Chỉ admin được phép truy cập
- Thường xuyên kiểm tra logs để phát hiện hoạt động bất thường
- Lưu trữ logs quan trọng trước khi cleanup

### MongoDB Indexes (Backend)
Để tối ưu performance, backend nên tạo indexes:
```javascript
db.admin_logs.createIndex({ "timestamp": -1 })
db.admin_logs.createIndex({ "username": 1 })
db.admin_logs.createIndex({ "action": 1 })
db.admin_logs.createIndex({ "resource_type": 1 })
db.admin_logs.createIndex({ "timestamp": -1, "username": 1 })
```

## Files liên quan

- `/src/pages/AdminLogs.jsx`: Component chính
- `/src/App.jsx`: Routing config
- `/src/pages/Navbar.jsx`: Menu navigation
- `/src/pages/Footer.jsx`: Footer component (shared)

## Future Enhancements

Các tính năng có thể thêm trong tương lai:
1. Export logs ra CSV/Excel
2. Realtime logs với WebSocket
3. Biểu đồ thống kê nâng cao (charts library)
4. Tìm kiếm full-text trong details
5. Bookmark/Save filters thường dùng
6. Email alerts cho hoạt động quan trọng
7. Diff viewer cho UPDATE actions
8. Restore capability cho deleted items

