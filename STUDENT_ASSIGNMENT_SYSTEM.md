# Giao Diện Học Sinh Làm Bài Tập - Student Assignment System

## Tổng Quan
Đã tạo hoàn chỉnh hệ thống cho học sinh xem và làm bài tập được giáo viên giao, bao gồm 3 trang chính:

## 1. StudentAssignments.jsx - Danh Sách Bài Tập

### Chức Năng
- Hiển thị tất cả bài tập được giao cho học sinh
- Lọc theo trạng thái: Tất cả / Chưa làm / Đã hoàn thành
- Thống kê tổng quan: Tổng bài tập, Chưa làm, Đã hoàn thành, Điểm TB

### Tính Năng Chi Tiết
**Thẻ Thống Kê (Statistics Cards):**
- Tổng bài tập (màu tím)
- Chưa làm (màu vàng)
- Đã hoàn thành (màu xanh lá)
- Điểm trung bình (màu xanh dương)

**Thông Tin Bài Tập:**
- Tiêu đề và mô tả
- Trạng thái: Đã đạt / Chưa đạt / Chưa làm / Quá hạn
- Topic (chủ đề)
- Số câu hỏi
- Điểm đạt (%)
- Giới hạn thời gian (nếu có)
- Deadline (highlight màu đỏ nếu quá hạn)
- Badge "BẮT BUỘC" nếu is_mandatory = true

**Hành Động:**
- Nút "Làm bài" (màu xanh lá) - cho bài chưa làm
- Nút "Xem kết quả" (màu xanh dương) - cho bài đã hoàn thành
- Disable nút "Làm bài" nếu quá deadline

### API Endpoint
```
GET https://api.dinhmanhhung.net/auth_mini/mba/assignments?username={username}
```

**Response Expected:**
```json
[
  {
    "_id": "assignment_id",
    "title": "Bài tập Marketing tuần 1",
    "description": "Luyện tập các khái niệm cơ bản",
    "topic": "marketing",
    "num_questions": 10,
    "passing_score": 70,
    "time_limit": 30,
    "deadline": "2024-01-15T23:59:00",
    "is_mandatory": true,
    "status": "pending" | "completed",
    "score": 85.0 // nếu completed
  }
]
```

---

## 2. StudentTakeAssignment.jsx - Giao Diện Làm Bài

### Chức Năng
- Hiển thị từng câu hỏi một
- Đếm ngược thời gian (nếu có time_limit)
- Navigation giữa các câu hỏi
- Tự động nộp bài khi hết giờ
- Xác nhận trước khi nộp

### Tính Năng Chi Tiết

**Header Section:**
- Tiêu đề và mô tả bài tập
- Timer đếm ngược với color coding:
  - Xanh lá: > 5 phút
  - Cam: 1-5 phút
  - Đỏ nhấp nháy: < 1 phút
- Progress bar hiển thị số câu đã trả lời

**Question Display:**
- Hiển thị câu hỏi hiện tại
- Badge "Đã trả lời" nếu đã chọn đáp án
- Radio buttons cho các đáp án
- Highlight đáp án đã chọn (màu tím)

**Navigation:**
- Nút "Câu trước" / "Câu tiếp"
- Nút "Nộp bài" ở câu cuối cùng
- Grid navigation bên phải:
  - Màu tím: Câu hiện tại
  - Màu xanh lá: Đã trả lời
  - Màu xám: Chưa trả lời

**Submit Confirmation Modal:**
- Hiển thị khi chưa trả lời hết câu hỏi
- Cảnh báo số câu chưa trả lời
- Cho phép quay lại hoặc xác nhận nộp

**Auto-Submit:**
- Tự động nộp bài khi hết thời gian
- Toast warning: "Hết thời gian! Tự động nộp bài..."

### API Endpoints

**Lấy thông tin bài tập:**
```
GET https://api.dinhmanhhung.net/auth_mini/mba/assignments/{assignmentId}
```

**Lấy câu hỏi:**
```
GET https://api.dinhmanhhung.net/auth_mini/mba/assignments/{assignmentId}/questions
```

**Response Expected:**
```json
[
  {
    "_id": "question_id",
    "question": "Câu hỏi về marketing?",
    "answers": [
      { "answer": "A. Đáp án A" },
      { "answer": "B. Đáp án B" },
      { "answer": "C. Đáp án C" },
      { "answer": "D. Đáp án D" }
    ],
    "correct_answer": "A. Đáp án A"
  }
]
```

**Nộp bài:**
```
POST https://api.dinhmanhhung.net/auth_mini/mba/assignments/{assignmentId}/submit
Content-Type: application/json

{
  "assignment_id": "assignment_id",
  "username": "student123",
  "answers": [
    {
      "question_id": "q1",
      "question": "Câu hỏi 1?",
      "user_answer": "A. Đáp án A",
      "correct_answer": "A. Đáp án A"
    }
  ],
  "time_taken": 1250 // seconds
}
```

---

## 3. StudentAssignmentResult.jsx - Xem Kết Quả

### Chức Năng
- Hiển thị kết quả chi tiết sau khi nộp bài
- So sánh với điểm đạt
- Xem từng câu hỏi với đáp án đúng/sai
- Thống kê tổng quan

### Tính Năng Chi Tiết

**Result Summary Card:**
- Gradient background dựa trên điểm:
  - Xanh lá (≥80%): Đạt xuất sắc
  - Vàng (60-79%): Đạt
  - Đỏ (<60%): Chưa đạt
- Icon Trophy (đạt) hoặc X Circle (chưa đạt)
- Điểm số lớn và rõ ràng
- So sánh với điểm đạt yêu cầu

**Statistics Grid:**
- Câu đúng (icon check màu xanh)
- Câu sai (icon X màu đỏ)
- Tổng số câu (icon question màu xanh dương)
- Thời gian làm bài (icon clock màu tím)

**Submission Info:**
- Thời gian nộp bài
- Thời gian làm bài (phút + giây)
- Chủ đề (topic badge)
- Trạng thái Đạt/Không đạt

**Chi Tiết Từng Câu (Toggle):**
- Click để mở/đóng
- Mỗi câu hỏi hiển thị:
  - Câu hỏi
  - Icon check/X
  - Câu trả lời của học sinh
  - Đáp án đúng (nếu trả lời sai)
- Color coding:
  - Câu đúng: Border xanh lá, background xanh nhạt
  - Câu sai: Border đỏ, background đỏ nhạt

**Warning Section (Nếu không đạt):**
- Box màu vàng nhạt
- Icon warning
- Khuyến nghị ôn tập và làm lại

### API Endpoint

**Lấy kết quả:**
```
GET https://api.dinhmanhhung.net/auth_mini/mba/assignments/{assignmentId}/result?username={username}
```

**Response Expected:**
```json
{
  "assignment_id": "assignment_id",
  "username": "student123",
  "score": 85.0,
  "passed": true,
  "correct_answers": 8,
  "total_questions": 10,
  "time_taken": 1250,
  "submitted_at": "2024-01-10T15:30:00",
  "detailed_results": [
    {
      "question": "Câu hỏi 1?",
      "user_answer": "A. Đáp án A",
      "correct_answer": "A. Đáp án A",
      "is_correct": true
    }
  ]
}
```

---

## Tích Hợp Navbar

### Desktop Menu
Thêm link "Bài tập" cho học sinh (không phải admin/teacher):
```jsx
{isLoggedIn && !isAdmin && !isTeacher && (
  <a href="/mini/student/assignments">
    <FaClipboardList /> Bài tập
  </a>
)}
```

### Mobile Menu
Tương tự, thêm vào hamburger menu:
```jsx
{isLoggedIn && !isAdmin && !isTeacher && (
  <a href="/mini/student/assignments">
    <FaClipboardList /> Bài tập của tôi
  </a>
)}
```

---

## Routes Đã Thêm

```jsx
// App.jsx
<Route path="/student/assignments" element={
  <PrivateRoute><StudentAssignments /></PrivateRoute>
} />

<Route path="/student/assignments/:assignmentId/take" element={
  <PrivateRoute><StudentTakeAssignment /></PrivateRoute>
} />

<Route path="/student/assignments/:assignmentId/result" element={
  <PrivateRoute><StudentAssignmentResult /></PrivateRoute>
} />
```

**Full URLs:**
- `/mini/student/assignments` - Danh sách bài tập
- `/mini/student/assignments/{id}/take` - Làm bài
- `/mini/student/assignments/{id}/result` - Xem kết quả

---

## User Flow

### Luồng Hoàn Chỉnh

1. **Học sinh đăng nhập** → Thấy menu "Bài tập"

2. **Click "Bài tập"** → `StudentAssignments.jsx`
   - Xem danh sách bài tập được giao
   - Lọc: Tất cả / Chưa làm / Đã hoàn thành
   - Xem thống kê tổng quan

3. **Click "Làm bài"** → `StudentTakeAssignment.jsx`
   - Timer bắt đầu đếm (nếu có time_limit)
   - Trả lời từng câu hỏi
   - Navigation qua lại giữa các câu
   - Click "Nộp bài"

4. **Xác nhận nộp** → Modal confirmation
   - Nếu chưa trả lời hết: Cảnh báo
   - Xác nhận → Submit

5. **Sau khi nộp** → Auto redirect → `StudentAssignmentResult.jsx`
   - Xem điểm số ngay lập tức
   - Đạt/Không đạt
   - Chi tiết từng câu với đáp án đúng

6. **Quay lại danh sách** → Thấy bài tập đã chuyển sang "Đã hoàn thành"
   - Click "Xem kết quả" để xem lại bất kỳ lúc nào

---

## Xử Lý Edge Cases

### 1. Hết Thời Gian
- Timer về 0 → Tự động gọi `handleAutoSubmit()`
- Toast warning
- Nộp bài với các câu đã trả lời

### 2. Quá Deadline
- Không cho phép làm bài
- Nút "Làm bài" bị disable
- Badge "Quá hạn" màu đỏ

### 3. Chưa Trả Lời Hết
- Modal xác nhận hiển thị
- Thông báo số câu chưa trả lời
- Cho phép quay lại hoặc nộp

### 4. Không Tìm Thấy Bài Tập
- Loading spinner khi fetch
- Error handling với toast
- Redirect về danh sách nếu lỗi

### 5. Token Hết Hạn
- `fetchWithAuth` tự động xử lý
- Auto logout nếu 401/403
- Redirect về login

---

## UI/UX Features

### Color Coding
**Status Badges:**
- Xanh lá: Đã đạt
- Cam: Chưa đạt (đã làm nhưng điểm thấp)
- Vàng: Chưa làm
- Đỏ: Quá hạn

**Score Display:**
- ≥80%: Gradient xanh lá
- 60-79%: Gradient vàng/cam
- <60%: Gradient đỏ

### Icons
- `faClipboardList`: Bài tập
- `faTrophy`: Thành tích, điểm đạt
- `faCheckCircle`: Đã hoàn thành, câu đúng
- `faTimesCircle`: Chưa đạt, câu sai
- `faClock`: Thời gian
- `faQuestionCircle`: Câu hỏi
- `faPlayCircle`: Làm bài
- `faEye`: Xem kết quả

### Responsive
- Grid layouts responsive (1 / 2 / 3 / 4 columns)
- Mobile menu riêng biệt
- Sidebar navigation sticky trên desktop
- Stack layout trên mobile

### Animations
- Progress bar transition: 300ms
- Hover effects trên buttons
- Timer blink animation khi < 1 phút
- Smooth scroll between questions

---

## Testing Checklist

### StudentAssignments
- [ ] Hiển thị đúng danh sách bài tập
- [ ] Filter tabs hoạt động
- [ ] Statistics đúng
- [ ] Status badges hiển thị chính xác
- [ ] Nút "Làm bài" disabled khi quá hạn
- [ ] Click "Làm bài" → Navigate đúng
- [ ] Click "Xem kết quả" → Navigate đúng

### StudentTakeAssignment
- [ ] Timer đếm ngược chính xác
- [ ] Auto-submit khi hết giờ
- [ ] Navigation buttons hoạt động
- [ ] Grid navigation click được
- [ ] Radio buttons select được
- [ ] Progress bar update theo answers
- [ ] Confirmation modal hiển thị đúng lúc
- [ ] Submit thành công → Redirect

### StudentAssignmentResult
- [ ] Hiển thị điểm số chính xác
- [ ] Pass/Fail status đúng
- [ ] Statistics cards đúng
- [ ] Toggle detailed results hoạt động
- [ ] Chi tiết câu hỏi hiển thị đầy đủ
- [ ] Color coding cho câu đúng/sai
- [ ] Quay lại danh sách hoạt động

### Navbar Integration
- [ ] Link "Bài tập" hiển thị cho student
- [ ] Không hiển thị cho admin/teacher
- [ ] Desktop menu hoạt động
- [ ] Mobile menu hoạt động

---

## Dependencies

**Packages:**
- `react-router-dom`: Navigation, useParams, useNavigate
- `@fortawesome/react-fontawesome`: Icons
- `react-toastify`: Toast notifications

**Custom Utilities:**
- `fetchWithAuth`: API calls với auto token handling
- `Navbar`, `Footer`: Layout components

**State Management:**
- useState, useEffect hooks
- Local state cho UI (no Redux needed)

---

## Files Created

1. `/src/pages/StudentAssignments.jsx` - Danh sách bài tập
2. `/src/pages/StudentTakeAssignment.jsx` - Làm bài quiz
3. `/src/pages/StudentAssignmentResult.jsx` - Xem kết quả

## Files Modified

1. `/src/App.jsx` - Added 3 routes
2. `/src/pages/Navbar.jsx` - Added "Bài tập" link for students

---

## Workflow Diagram

```
Student Login
    ↓
[Navbar] "Bài tập" Link
    ↓
StudentAssignments.jsx
├── Filter: All / Pending / Completed
├── Stats: Total, Pending, Completed, Avg Score
└── Assignment List
    ├── [Làm bài] → StudentTakeAssignment.jsx
    │               ├── Timer countdown
    │               ├── Question navigation
    │               ├── Answer selection
    │               ├── Auto-submit when time up
    │               └── [Nộp bài] → Submit
    │                               ↓
    │                   StudentAssignmentResult.jsx
    │                   ├── Score display
    │                   ├── Pass/Fail status
    │                   ├── Statistics
    │                   └── Detailed Q&A review
    │
    └── [Xem kết quả] → StudentAssignmentResult.jsx
```

---

## Next Enhancements (Future)

1. **Retry Policy:**
   - Cho phép làm lại bài không đạt
   - Lưu nhiều attempt
   - Hiển thị attempt history

2. **Question Explanation:**
   - Hiển thị giải thích cho đáp án đúng
   - Link đến tài liệu liên quan

3. **Progress Tracking:**
   - Chart hiển thị tiến độ theo thời gian
   - So sánh với học sinh khác (leaderboard)

4. **Notifications:**
   - Email reminder trước deadline
   - Push notification khi có bài tập mới

5. **Offline Mode:**
   - Download bài tập để làm offline
   - Sync khi có internet

6. **Accessibility:**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

---

## Completed! ✅

Hệ thống học sinh làm bài tập đã hoàn thiện với:
- 3 trang giao diện đầy đủ
- Timer tự động
- Navigation thông minh
- Responsive design
- Error handling
- Auto-submit
- Detailed feedback
- Integration với Navbar

Sẵn sàng để test và deploy! 🚀
