# API Update - Student Assignment System

## Tóm Tắt Thay Đổi

Đã cập nhật các API endpoint cho hệ thống student assignment theo tài liệu mới, đảm bảo đồng bộ với backend.

---

## API Endpoints Đã Sửa

### 1. StudentAssignments.jsx - Danh Sách Bài Tập

**Trước (❌ SAI):**
```javascript
GET /auth_mini/mba/assignments?username={username}
```

**Sau (✅ ĐÚNG):**
```javascript
GET /auth_mini/mba/student/assignments
```

**Response Format:**
```json
{
  "assignments": [
    {
      "_id": "assignment_id",
      "title": "Kiểm tra Marketing tuần 1",
      "description": "...",
      "topic": "marketing",
      "num_questions": 10,
      "passing_score": 70,
      "time_limit": 30,
      "deadline": "2024-12-31T23:59:59",
      "status": "pending" | "completed" | "overdue",
      "created_by": "teacher1",
      "created_at": "2024-01-01T00:00:00",
      "submission": {
        "submitted_at": "...",
        "score": 85,
        "passed": true
      }
    }
  ],
  "total": 2,
  "pending": 1,
  "completed": 1,
  "overdue": 0
}
```

**Thay Đổi Code:**
- Đổi endpoint từ `assignments?username=` → `student/assignments`
- Xử lý response: `result.assignments` thay vì array trực tiếp
- Lấy score từ `assignment.submission?.score` thay vì `assignment.score`
- Lấy passed từ `assignment.submission?.passed`

---

### 2. StudentTakeAssignment.jsx - Lấy Câu Hỏi

**Trước (❌ SAI):**
```javascript
// 2 API calls riêng biệt
GET /auth_mini/mba/assignments/{id}  // Lấy assignment details
GET /auth_mini/mba/assignments/{id}/questions  // Lấy questions
```

**Sau (✅ ĐÚNG):**
```javascript
// 1 API call duy nhất
GET /auth_mini/mba/student/assignments/{id}/questions
```

**Response Format:**
```json
{
  "assignment_id": "6789...",
  "title": "Kiểm tra Marketing tuần 1",
  "description": "...",
  "topic": "marketing",
  "num_questions": 10,
  "passing_score": 70,
  "time_limit": 30,
  "deadline": "2024-12-31T23:59:59",
  "questions": [
    {
      "assignment_index": 0,
      "question": "Marketing mix gồm mấy P?",
      "choices": ["2P", "4P", "7P", "10P"]
    }
  ]
}
```

**Thay Đổi Code:**
- Gộp 2 API calls thành 1
- Endpoint: `student/assignments/{id}/questions`
- Response trả về cả assignment details + questions
- Questions dùng `choices` array thay vì `answers` array với object
- Questions có `assignment_index` thay vì `_id`
- **KHÔNG có `correct_answer`** trong response

---

### 3. StudentTakeAssignment.jsx - Nộp Bài

**Trước (❌ SAI):**
```javascript
POST /auth_mini/mba/assignments/{id}/submit

Body: {
  "assignment_id": "...",
  "username": "student1",
  "answers": [
    {
      "question_id": "q1",
      "question": "...",
      "user_answer": "4P",
      "correct_answer": "4P"  // ❌ Frontend không có correct_answer
    }
  ],
  "time_taken": 1200
}
```

**Sau (✅ ĐÚNG):**
```javascript
POST /auth_mini/mba/submit_assignment

Body: {
  "assignment_id": "assignment_id",
  "answers": [
    {
      "assignment_index": 0,
      "answer": "4P"
    }
  ],
  "time_taken": 1200
}
```

**Response Format:**
```json
{
  "msg": "Assignment submitted successfully",
  "submission_id": "abc123...",
  "score": 85,
  "correct_answers": 8,
  "total_questions": 10,
  "passing_score": 70,
  "passed": true,
  "detailed_results": [
    {
      "assignment_index": 0,
      "question": "Marketing mix gồm mấy P?",
      "user_answer": "4P",
      "correct_answer": "4P",
      "is_correct": true
    }
  ]
}
```

**Thay Đổi Code:**
- Endpoint: `submit_assignment` (không có `/assignments/{id}/submit`)
- **Bỏ `username`** trong body (backend tự lấy từ token)
- Answers structure đơn giản hơn:
  - `assignment_index` thay vì `question_id`
  - `answer` thay vì `user_answer`
  - **Không gửi `question` và `correct_answer`**

---

### 4. StudentAssignmentResult.jsx - Xem Kết Quả

**Trước (❌ SAI):**
```javascript
// 2 API calls
GET /auth_mini/mba/assignments/{id}  // Assignment details
GET /auth_mini/mba/assignments/{id}/result?username={username}  // Result
```

**Sau (✅ ĐÚNG):**
```javascript
// 1 API call
GET /auth_mini/mba/student/assignments/{id}/result
```

**Response Format:**
```json
{
  "assignment_title": "Kiểm tra Marketing tuần 1",
  "assignment_description": "...",
  "topic": "marketing",
  "passing_score": 70,
  "time_limit": 30,
  "score": 85,
  "correct_answers": 8,
  "total_questions": 10,
  "passed": true,
  "time_taken": 1200,
  "submitted_at": "2024-01-10T14:30:00",
  "detailed_results": [
    {
      "assignment_index": 0,
      "question": "Marketing mix gồm mấy P?",
      "user_answer": "4P",
      "correct_answer": "4P",
      "is_correct": true
    }
  ]
}
```

**Thay Đổi Code:**
- Gộp 2 API calls thành 1
- Endpoint: `student/assignments/{id}/result`
- **Bỏ query param `?username=`** (backend tự lấy từ token)
- Response trả về cả assignment info + submission result

---

## So Sánh URL Patterns

### OLD (❌):
```
GET  /auth_mini/mba/assignments?username={user}
GET  /auth_mini/mba/assignments/{id}
GET  /auth_mini/mba/assignments/{id}/questions
POST /auth_mini/mba/assignments/{id}/submit
GET  /auth_mini/mba/assignments/{id}/result?username={user}
```

### NEW (✅):
```
GET  /auth_mini/mba/student/assignments
GET  /auth_mini/mba/student/assignments/{id}/questions
POST /auth_mini/mba/submit_assignment
GET  /auth_mini/mba/student/assignments/{id}/result
```

**Key Differences:**
1. Thêm prefix `/student/` để phân biệt student vs teacher APIs
2. Submit endpoint không theo pattern RESTful (là `/submit_assignment` độc lập)
3. Bỏ hết query parameters `?username=` (dùng JWT token)
4. Gộp nhiều API calls thành 1 để giảm network requests

---

## Thay Đổi Data Structure

### Questions Structure

**OLD:**
```javascript
{
  "_id": "question_id",
  "question": "...",
  "answers": [
    { "answer": "A. Đáp án A" },
    { "answer": "B. Đáp án B" }
  ],
  "correct_answer": "A. Đáp án A"
}
```

**NEW:**
```javascript
{
  "assignment_index": 0,
  "question": "...",
  "choices": ["A. Đáp án A", "B. Đáp án B"]
}
```

**Lý do:**
- `choices` là array string đơn giản, không cần object wrapper
- `assignment_index` để tracking câu hỏi trong assignment
- **Không có `correct_answer`** để tránh student xem được đáp án

### Assignment Status

**NEW Status Values:**
- `pending`: Chưa làm, chưa quá hạn
- `completed`: Đã nộp bài
- `overdue`: Quá deadline nhưng chưa làm

**Kiểm tra trong code:**
```javascript
// Completed
if (assignment.status === 'completed') {
  const score = assignment.submission?.score;
  const passed = assignment.submission?.passed;
}

// Overdue
if (assignment.status === 'overdue' || isOverdue(assignment.deadline)) {
  // Không cho phép làm bài
}
```

---

## Authentication

**Tất cả APIs đều dùng JWT Token:**
```javascript
const response = await fetchWithAuth(url);
// fetchWithAuth tự động thêm header:
// Authorization: Bearer {token}
```

**Backend tự động:**
- Extract username từ JWT token
- Kiểm tra quyền truy cập (student chỉ xem được assignment của mình)
- Validate deadline, submit status, etc.

---

## Error Handling

**Common Errors:**

1. **Not assigned (403):**
   ```json
   {"detail": "You are not assigned to this assignment"}
   ```

2. **Already submitted (400):**
   ```json
   {"detail": "Assignment already submitted"}
   ```

3. **Deadline passed (400):**
   ```json
   {"detail": "Deadline has passed"}
   ```

4. **Invalid token (401):**
   ```json
   {"detail": "Could not validate credentials"}
   ```

**Xử lý trong code:**
```javascript
try {
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error('Failed to ...');
  }
  const data = await response.json();
} catch (err) {
  console.error('Error:', err);
  toast.error('Không thể tải dữ liệu');
  navigate('/mini/student/assignments');
}
```

---

## Testing Checklist

### StudentAssignments.jsx
- [ ] Load assignments list successfully
- [ ] Assignments array from `response.assignments`
- [ ] Status badges hiển thị đúng (pending/completed/overdue)
- [ ] Score từ `assignment.submission?.score`
- [ ] Passed từ `assignment.submission?.passed`
- [ ] Filter tabs hoạt động

### StudentTakeAssignment.jsx
- [ ] Load questions với 1 API call
- [ ] Questions dùng `choices` array
- [ ] Questions có `assignment_index`
- [ ] Submit với format mới (assignment_index + answer)
- [ ] Không gửi username trong body
- [ ] Redirect to result page sau submit

### StudentAssignmentResult.jsx
- [ ] Load result với 1 API call
- [ ] Response chứa cả assignment info + result
- [ ] Score, passed, detailed_results hiển thị đúng
- [ ] Chi tiết câu hỏi với is_correct, correct_answer

---

## Files Modified

1. **StudentAssignments.jsx**
   - Line ~40: Changed API endpoint
   - Line ~45: Handle `response.assignments`
   - Line ~60: Use `assignment.submission?.score`
   - Line ~90: Use `assignment.submission?.passed`

2. **StudentTakeAssignment.jsx**
   - Line ~52: Merged 2 API calls into 1
   - Line ~70: Changed endpoint to `/student/assignments/{id}/questions`
   - Line ~135: Changed submit endpoint to `/submit_assignment`
   - Line ~145: Simplified answer structure
   - Line ~280: Changed `answers` to `choices`

3. **StudentAssignmentResult.jsx**
   - Line ~34: Merged 2 API calls into 1
   - Line ~40: Changed endpoint to `/student/assignments/{id}/result`
   - Line ~50: Parse response structure

---

## Migration Notes

**Nếu Backend chưa cập nhật:**
- Student APIs sẽ trả về 404
- Cần deploy backend mới trước khi test frontend

**Để test với backend cũ:**
- Revert commit này
- Hoặc update backend trước

**Deployment Order:**
1. ✅ Backend deploy trước (với APIs mới)
2. ✅ Frontend deploy sau (dùng APIs mới)

---

## Kết Luận

✅ **Đã cập nhật tất cả student API endpoints**
✅ **Đồng bộ với tài liệu backend mới**
✅ **Đơn giản hóa data structure**
✅ **Giảm số lượng API calls (2→1)**
✅ **Bỏ username khỏi request (dùng JWT)**
✅ **Security: Không expose correct_answer trước khi submit**

Sẵn sàng để test với backend đã cập nhật! 🚀
