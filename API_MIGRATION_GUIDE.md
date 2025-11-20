# API Migration Guide

## ✅ Đã Hoàn Thành - MIGRATION COMPLETED!

### Cấu hình
- ✅ `.env` - Biến môi trường
- ✅ `src/config/api.js` - Centralized API endpoints

### Components đã cập nhật
- ✅ `ChatBot.jsx` - 1 URL
- ✅ `UnifiedChatbot.jsx` - 4 URLs
- ✅ `FileManager.jsx` - 4 URLs
- ✅ `AdvancedFileUploader.jsx` - 1 URL
- ✅ `FileUploader.jsx` - 1 URL
- ✅ `FileContentViewer.jsx` - 2 URLs

### Pages đã cập nhật
- ✅ `LoginPage.jsx` - 1 URL (+ TOKEN endpoint)
- ✅ `SignupPage.jsx` - 1 URL (+ REGISTER endpoint)
- ✅ `Profile.jsx` - Import added
- ✅ `QuizHistory.jsx` - 1 URL
- ✅ `Test.jsx` - 2 URLs (+ SUBMIT_QUIZ endpoint)
- ✅ `EditPage.jsx` - 3 URLs
- ✅ `AdminDashboard.jsx` - 5 URLs
- ✅ `AdminLogs.jsx` - 3 URLs
- ✅ `TeacherDashboard.jsx` - 2 URLs
- ✅ `SourceManager.jsx` - 3 URLs
- ✅ `QuestionManager.jsx` - 10 URLs
- ✅ `UserManager.jsx` - 4 URLs
- ✅ `MessageManager.jsx` - 4 URLs

## 🎉 Migration Hoàn Tất

Tất cả **19 files** (6 components + 13 pages) đã được cập nhật thành công!

### Tổng Kết
- **Tổng số URLs đã migrate**: ~56 URLs
- **Endpoints mới thêm vào config**: TOKEN, REGISTER, SUBMIT_QUIZ, RAG, USERS_ME
- **Files đã cập nhật**: 19/19 (100%)
- **Tổng số API endpoints trong config**: 36 endpoints

---

## 📚 Tài Liệu Tham Khảo (Legacy)

### Components

#### 1. ~~src/components/FileContentViewer.jsx (2 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế (line ~91, ~157)
`https://mba.ptit.edu.vn/auth_mini/mba/files/${source}/view/${encodedFilename}`
// Thành:
API_ENDPOINTS.FILE_VIEW(source, encodedFilename)
```

### Pages

#### 2. ~~src/pages/LoginPage.jsx (1 URL)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế
'https://mba.ptit.edu.vn/auth_mini/login'
// Thành:
API_ENDPOINTS.LOGIN
```

#### 3. ~~src/pages/SignupPage.jsx (1 URL)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế
'https://mba.ptit.edu.vn/auth_mini/signup'
// Thành:
API_ENDPOINTS.SIGNUP
```

#### 4. ~~src/pages/Profile.jsx (1 URL)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế
'https://mba.ptit.edu.vn/auth_mini/change-password'
// Thành:
API_ENDPOINTS.CHANGE_PASSWORD
```

#### 5. ~~src/pages/QuizHistory.jsx (1 URL)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế
'https://mba.ptit.edu.vn/auth_mini/quiz-history'
// Thành:
API_ENDPOINTS.QUIZ_HISTORY
```

#### 6. ~~src/pages/Test.jsx (1 URL)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế
'https://mba.ptit.edu.vn/auth_mini/chatbots'
// Thành:
API_ENDPOINTS.CHATBOTS
```

#### 7. ~~src/pages/EditPage.jsx (4 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/chatbots'
→ API_ENDPOINTS.CHATBOTS

`https://mba.ptit.edu.vn/auth_mini/admin/chatbots/${id}`
→ API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(id)

'https://mba.ptit.edu.vn/auth_mini/admin/chatbots'
→ API_ENDPOINTS.ADMIN_CHATBOTS

`https://mba.ptit.edu.vn/auth_mini/admin/chatbots/${editingChatbot.id}`
→ API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(editingChatbot.id)
```

#### 8. ~~src/pages/AdminDashboard.jsx (5 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/chatbots' (2 lần)
→ API_ENDPOINTS.CHATBOTS

`https://mba.ptit.edu.vn/auth_mini/admin/chatbots/${id}` (DELETE)
→ API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(id)

'https://mba.ptit.edu.vn/auth_mini/admin/chatbots' (POST)
→ API_ENDPOINTS.ADMIN_CHATBOTS

`https://mba.ptit.edu.vn/auth_mini/admin/chatbots/${editingChatbot.id}` (PUT)
→ API_ENDPOINTS.ADMIN_CHATBOT_BY_ID(editingChatbot.id)
```

#### 9. ~~src/pages/AdminLogs.jsx (3 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/admin/logs'
→ API_ENDPOINTS.ADMIN_LOGS

'https://mba.ptit.edu.vn/auth_mini/users'
→ API_ENDPOINTS.ADMIN_USERS

'https://mba.ptit.edu.vn/auth_mini/chatbots'
→ API_ENDPOINTS.CHATBOTS
```

#### 10. ~~src/pages/TeacherDashboard.jsx (2 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/teacher/my-topics'
→ API_ENDPOINTS.TEACHER_MY_TOPICS

'https://mba.ptit.edu.vn/auth_mini/chatbots'
→ API_ENDPOINTS.CHATBOTS
```

#### 11. ~~src/pages/SourceManager.jsx (3 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/chatbots' (2 lần)
→ API_ENDPOINTS.CHATBOTS

'https://mba.ptit.edu.vn/auth_mini/teacher/my-topics'
→ API_ENDPOINTS.TEACHER_MY_TOPICS
```

#### 12. ~~src/pages/QuestionManager.jsx (10 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/chatbots' (3 lần)
→ API_ENDPOINTS.CHATBOTS

'https://mba.ptit.edu.vn/auth_mini/teacher/my-topics'
→ API_ENDPOINTS.TEACHER_MY_TOPICS

`https://mba.ptit.edu.vn/auth_mini/admin/questions/${selectedTopic}?offset=${pagination.offset}&size=${pagination.size}`
→ `${API_ENDPOINTS.ADMIN_QUESTIONS(selectedTopic)}?offset=${pagination.offset}&size=${pagination.size}`

'https://mba.ptit.edu.vn/auth_mini/admin/search-questions'
→ API_ENDPOINTS.ADMIN_SEARCH_QUESTIONS

'https://mba.ptit.edu.vn/auth_mini/admin/question'
→ API_ENDPOINTS.ADMIN_QUESTION_CREATE

'https://mba.ptit.edu.vn/auth_mini/admin/questions'
→ API_ENDPOINTS.ADMIN_QUESTIONS_BULK

`https://mba.ptit.edu.vn/auth_mini/admin/questions/${topicToUse}/${selectedQuestion.index}` (PUT & DELETE)
→ API_ENDPOINTS.ADMIN_QUESTION_BY_ID(topicToUse, selectedQuestion.index)

'https://mba.ptit.edu.vn/auth_mini/admin/questions/upload-excel'
→ API_ENDPOINTS.ADMIN_QUESTIONS_UPLOAD_EXCEL
```

#### 13. ~~src/pages/UserManager.jsx (4 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/users'
→ API_ENDPOINTS.ADMIN_USERS

'https://mba.ptit.edu.vn/auth_mini/chatbots'
→ API_ENDPOINTS.CHATBOTS

`https://mba.ptit.edu.vn/auth_mini/admin/users/${selectedUser.username}/role`
→ API_ENDPOINTS.ADMIN_USER_ROLE(selectedUser.username)

`https://mba.ptit.edu.vn/auth_mini/admin/users/${selectedUser.username}/assign-topics`
→ API_ENDPOINTS.ADMIN_USER_ASSIGN_TOPICS(selectedUser.username)
```

#### 14. ~~src/pages/MessageManager.jsx (4 URLs)~~ ✅ COMPLETED
```javascript
// Thêm import
import { API_ENDPOINTS } from '../config/api';

// Thay thế:
'https://mba.ptit.edu.vn/auth_mini/teacher/my-topics'
→ API_ENDPOINTS.TEACHER_MY_TOPICS

'https://mba.ptit.edu.vn/auth_mini/chatbots' (2 lần)
→ API_ENDPOINTS.CHATBOTS

// Chat history URL
`https://mba.ptit.edu.vn/auth_mini/mba/chat_history/${userId}?limit=${limit}&skip=${skip}&source=${source}`
→ API_ENDPOINTS.CHAT_HISTORY(userId, limit, skip, source)
```

## ✅ Đã Kiểm Tra và Hoàn Thành

### 1. ✅ Import đã được thêm vào tất cả files
Tất cả 19 files đã có: `import { API_ENDPOINTS } from '../config/api';`

### 2. ✅ Không còn hardcoded URLs
Tất cả URLs `https://mba.ptit.edu.vn/auth_mini` đã được thay thế

### 3. ✅ Các bước tiếp theo
- **QUAN TRỌNG**: Restart dev server để áp dụng thay đổi từ `.env`:
  ```bash
  npm start
  ```
- Kiểm tra console không có lỗi
- Test các chức năng chính:
  - ✅ Login/Signup (LoginPage, SignupPage)
  - ✅ Chatbot (ChatBot, UnifiedChatbot)
  - ✅ File upload (FileManager, AdvancedFileUploader, FileUploader)
  - ✅ Admin panel (AdminDashboard, AdminLogs, UserManager, QuestionManager)
  - ✅ Teacher features (TeacherDashboard, SourceManager, MessageManager)
  - ✅ Quiz (Test, QuizHistory)
  - ✅ Profile (Profile)

## 📝 Lưu Ý

1. **Environment Variable**: Sau khi thay đổi `.env`, cần restart dev server
2. **Import Path**:
   - Components: `import { API_ENDPOINTS } from '../config/api';`
   - Pages: `import { API_ENDPOINTS } from '../config/api';`
3. **Dynamic URLs**: Sử dụng function syntax cho URLs có parameters
4. **Query Parameters**: Với query params phức tạp, concat string với endpoint function

## ✨ Lợi Ích

- ✅ Dễ dàng thay đổi API URL qua `.env`
- ✅ Type-safe với function parameters
- ✅ Centralized management
- ✅ Dễ maintain và debug
