# Quiz-Based Assignment System Update

## Overview
Converted the generic assignment system to a quiz-based MCQ (Multiple Choice Question) assignment system where teachers create structured quizzes for students.

## Changes Made

### 1. AssignmentSubmissions.jsx
Updated to display detailed quiz results:

#### New Helper Functions
- `getPassedBadge(passed)` - Shows "Đạt" (Pass) or "Không đạt" (Fail) badge
- `formatTime(seconds)` - Formats time taken in MM:SS format

#### Updated Submission Table
**New Columns:**
- **Kết quả**: Pass/Fail badge based on passing score
- **Số câu đúng**: Shows correct answers out of total (e.g., "8/10")
- **Thời gian làm**: Time taken to complete quiz in MM:SS format
- **Điểm**: Score now shown with decimal (e.g., "85.0%")

**Previous Columns Removed:**
- Simple "Số câu" column replaced with detailed "Số câu đúng"

### 2. TeacherAssignments.jsx
Updated both Create and Edit modals to include quiz-specific fields:

#### Quiz Fields in Create Modal
Already had these fields:
- **Số câu hỏi** (Number of questions): 1-50, required, system randomly selects from topic
- **Điểm đạt (%)** (Passing score): 0-100%, required, minimum score to pass
- **Giới hạn thời gian** (Time limit): Optional, in minutes, leave blank for unlimited

#### Quiz Fields in Edit Modal
**Added the missing quiz fields:**
- **Chủ đề (Topic)**: Dropdown to select quiz topic
- **Số câu hỏi**: Number input with question icon
- **Điểm đạt (%)**: Percentage passing score
- **Giới hạn thời gian**: Time limit in minutes with clock icon

#### Assignment Display Cards
Already shows:
- Topic badge (purple)
- Number of questions (blue)
- Passing score percentage (green)
- Time limit with clock icon (if set)
- Deadline with calendar icon
- Completion count with checkmark icon
- Assignment recipients with users icon

## Data Model

### Assignment Object
```javascript
{
  title: "Bài tập Marketing tuần 1",
  description: "Luyện tập về các khái niệm marketing cơ bản",
  topic: "marketing",
  num_questions: 10,
  passing_score: 70,
  time_limit: 30,  // minutes, optional
  assigned_to: ["all", "marketing", "user123"],
  deadline: "2024-01-15T23:59",
  is_mandatory: true,
  question_indices: null  // null = random, or array of specific question IDs
}
```

### Submission Object
```javascript
{
  username: "student123",
  score: 85.0,  // percentage
  passed: true,  // based on passing_score
  correct_answers: 8,
  total_questions: 10,
  time_taken: 1250,  // seconds
  submitted_at: "2024-01-10T15:30:00",
  detailed_results: [...]  // question-by-question breakdown
}
```

## User Workflow

### Teacher Creates Assignment
1. Click "Tạo Bài Tập Mới"
2. Enter title and description
3. Select topic from dropdown (only shows teacher's topics)
4. Set number of questions (system will random select)
5. Set passing score percentage
6. Optionally set time limit
7. Choose recipients (all students, by topic, or individual students)
8. Set deadline
9. System automatically generates quiz from question pool

### Student Takes Quiz
(To be implemented in next phase)
1. See assignment in their assignment list
2. Click to start quiz
3. Timer starts (if time limit set)
4. Answer MCQ questions one by one
5. Submit answers
6. Receive instant grade and feedback

### Teacher Views Results
1. Click eye icon on assignment card
2. See completion rate statistics
3. View detailed table of submitted students:
   - Score with color coding (green ≥80%, yellow ≥60%, red <60%)
   - Pass/Fail badge
   - Correct answers vs total questions
   - Time taken to complete
   - Submission timestamp
4. See list of students who haven't submitted yet

## UI Improvements

### Color Coding
- **Score badges**: 
  - Green (≥80%): Excellent performance
  - Yellow (≥60%): Acceptable performance
  - Red (<60%): Needs improvement
  
- **Pass/Fail badges**:
  - Green "Đạt": Student passed
  - Red "Không đạt": Student failed

### Icons Used
- `faQuestionCircle`: Number of questions
- `faClock`: Time limit and time taken
- `faCalendar`: Deadline
- `faCheckCircle`: Completed assignments
- `faUsers`: Assignment recipients
- `faEye`: View submissions
- `faEdit`: Edit assignment
- `faTrash`: Delete assignment

## Next Steps

### Phase 1: Student-Facing Pages (Priority)
1. **StudentAssignmentList.jsx**
   - Display pending assignments with deadline
   - Show completed assignments with score
   - Filter by pending/completed/all

2. **StudentTakeAssignment.jsx**
   - Quiz interface with timer
   - Question navigation (previous/next)
   - Submit confirmation
   - Auto-submit when time runs out

3. **StudentAssignmentResult.jsx**
   - Overall score and pass/fail status
   - Question-by-question review
   - Correct answer explanations
   - Time taken statistics

### Phase 2: Backend API Updates
Ensure backend supports:
- `GET /assignments?username={username}` - Get student's assignments
- `GET /assignments/{id}/questions` - Get quiz questions for taking
- `POST /assignments/{id}/submit` - Submit quiz answers with auto-grading
- `GET /assignments/{id}/result` - Get detailed results for student

### Phase 3: Additional Features
- Question bank management for teachers
- Assignment analytics (hardest questions, average time per question)
- Retry policy (allow students to retake failed assignments)
- Question shuffling for each student
- Answer option shuffling to prevent cheating

## Testing Checklist

### Teacher Features
- [ ] Create new quiz assignment with all fields
- [ ] Edit existing assignment and verify all fields update
- [ ] Delete assignment
- [ ] View submission list with correct statistics
- [ ] Verify score color coding works correctly
- [ ] Verify pass/fail badges display correctly
- [ ] Check time formatting is correct (MM:SS)

### Data Validation
- [ ] Number of questions: 1-50 range enforced
- [ ] Passing score: 0-100% range enforced
- [ ] Time limit: Optional, accepts positive integers only
- [ ] Deadline: Date/time picker works correctly
- [ ] Assignment recipients: Can select all/topics/individuals

### Edge Cases
- [ ] Assignment with no submissions
- [ ] Assignment with 100% completion rate
- [ ] Students who haven't submitted yet
- [ ] Unlimited time assignments (no time_limit)
- [ ] Perfect score (100%)
- [ ] Zero score (0%)

## Files Modified
1. `/src/pages/AssignmentSubmissions.jsx` - Enhanced submission display with quiz details
2. `/src/pages/TeacherAssignments.jsx` - Added quiz fields to edit modal

## Dependencies
- React, useState, useEffect, useNavigate, useParams
- FontAwesome icons
- fetchWithAuth utility for API calls
- react-toastify for notifications
- Tailwind CSS for styling
