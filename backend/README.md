# CareerAI Backend - Simple File Upload Server

A simple Express.js backend server for handling resume file uploads.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Create .env file
Copy `.env.example` to `.env` and update if needed:
```bash
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Run the Server
```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Returns server status

### Upload Resume
```
POST /api/upload
```
- **Body:** multipart/form-data
- **Field:** `resume` (file)
- **Allowed types:** PDF, DOC, DOCX
- **Max size:** 10MB

**Response:**
```json
{
  "status": "success",
  "message": "File uploaded successfully",
  "data": {
    "filename": "resume-1234567890.pdf",
    "originalName": "my-resume.pdf",
    "size": 123456,
    "mimetype": "application/pdf",
    "path": "/path/to/file",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Uploaded Files
```
GET /api/uploads
```
Returns list of all uploaded files

## 📁 Project Structure

```
backend/
├── src/
│   └── server.ts          # Main server file
├── uploads/               # Uploaded files (auto-created)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Upload file
curl -X POST http://localhost:5000/api/upload \
  -F "resume=@/path/to/your/resume.pdf"

# Get uploaded files
curl http://localhost:5000/api/uploads
```

## 🔧 Technologies

- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
