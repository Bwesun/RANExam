# RanExam Backend API

A comprehensive examination management system built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (Student, Instructor, Admin)
  - Password reset and email verification
  - Session management

- **User Management**
  - CRUD operations for users
  - Profile management
  - Bulk user operations
  - User statistics and analytics

- **Exam Management**
  - Create and manage exams
  - Question bank with categories
  - Exam scheduling and settings
  - Real-time exam taking

- **Question Management**
  - Multiple choice questions with up to 5 options
  - Question categorization and tagging
  - Bulk import/export
  - Question analytics

- **Exam Attempts & Results**
  - Real-time exam taking
  - Answer submission and validation
  - Detailed result analytics
  - Performance tracking

- **File Uploads**
  - Profile image uploads
  - Question image attachments
  - Bulk import via CSV/JSON

- **Admin Dashboard**
  - System statistics
  - User management
  - Data export capabilities
  - Audit logging

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with Sharp for image processing
- **Email**: Nodemailer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation & Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ranexam-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ranexam
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod

   # Or using MongoDB service
   sudo systemctl start mongod
   ```

5. **Seed the database (optional)**

   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The API server will be running at `http://localhost:5000`

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/logout` - Logout user

### User Management

- `GET /api/users` - Get all users (with filtering)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user (Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/:id/stats` - Get user statistics

### Exam Management

- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get single exam
- `POST /api/exams` - Create new exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `GET /api/exams/:id/analytics` - Get exam analytics
- `POST /api/exams/:id/duplicate` - Duplicate exam

### Question Management

- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `PUT /api/questions/:id/review` - Approve/reject question
- `POST /api/questions/bulk-import` - Bulk import questions

### Exam Attempts

- `POST /api/attempts/start` - Start new exam attempt
- `GET /api/attempts/current/:examId` - Get current attempt
- `PUT /api/attempts/:id/answer` - Submit answer
- `PUT /api/attempts/:id/flag/:questionIndex` - Flag question
- `POST /api/attempts/:id/submit` - Submit exam
- `GET /api/attempts/:id/result` - Get attempt result

### Results & Analytics

- `GET /api/results` - Get exam results
- `GET /api/results/:id` - Get detailed result
- `GET /api/results/exam/:examId/analytics` - Get exam analytics
- `GET /api/results/user/:userId/summary` - Get user summary
- `GET /api/results/export/:examId` - Export results to CSV

### File Uploads

- `POST /api/upload/profile-image` - Upload profile image
- `POST /api/upload/question-image` - Upload question image
- `POST /api/upload/bulk-import` - Bulk import data
- `DELETE /api/upload/:filename` - Delete uploaded file

### Admin Dashboard

- `GET /api/admin/dashboard` - Get system statistics
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings
- `POST /api/admin/users/bulk` - Bulk user operations
- `POST /api/admin/maintenance` - System maintenance
- `GET /api/admin/export/:type` - Export system data

## Database Models

### User Model

- Authentication and profile information
- Role-based permissions
- Exam statistics
- Login tracking

### Exam Model

- Exam configuration and settings
- Question associations
- Analytics and performance data
- Scheduling and availability

### Question Model

- Question content and options
- Difficulty and categorization
- Usage analytics
- Review and approval workflow

### ExamAttempt Model

- Real-time exam progress
- Answer submissions
- Result calculations
- Proctoring data

## Security Features

- JWT token authentication
- Role-based authorization
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Helmet for security headers
- CORS configuration
- Password hashing with bcrypt

## Error Handling

The API uses a centralized error handling middleware that:

- Handles different types of errors (validation, database, authentication)
- Provides consistent error response format
- Logs errors for debugging
- Sanitizes error messages for production

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
EMAIL_HOST=your-smtp-host
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment

```bash
# Build Docker image
docker build -t ranexam-backend .

# Run container
docker run -p 5000:5000 --env-file .env ranexam-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
