# Job Portal Backend

A RESTful backend for a job portal application built with Node.js, Express, and MongoDB, enhanced with AI-powered features such as mock interviews, aptitude practice, tech roadmaps, and mentoring.

---

### Frontend Repository

This backend works together with the frontend application, which you can find here:
**[Job Portal Frontend GitHub Repository](https://github.com/digvijaypandit/job-portal-Frontend)**

---

---

## 📦 Table of Contents

- [Features](#features)  
- [Getting Started](#getting-started)  
- [Environment Variables](#environment-variables)  
- [Available Scripts](#available-scripts)  
- [API Endpoints](#api-endpoints)  
- [Technologies Used](#technologies-used)  
- [Contributing](#contributing)  
- [License](#license)

---

## Features

- **User Authentication** – Register/login with secure JWT token-based sessions  
- **Job Posting** – CRUD for jobs by employers  
- **Job Applications** – Apply to jobs with resume uploads  
- **File Uploads** – Store resumes, profile pictures securely with Multer  
- **Clean Architecture** – Organized routing, middleware, and controller logic  
- **AI-Powered Mock Interviews** – Simulate technical or HR interviews using Gemini AI  
- **Practice Aptitude Tests** – Generate aptitude-style questions and track performance  
- **Quizzes** – Topic-wise quizzes for frontend/backend/DSA/aptitude  
- **Tech Roadmap Generator** – Custom learning paths based on role (Frontend, Backend, Fullstack, etc.)  
- **AI Mentorship** – Chat-based career advice, resume feedback, and skill improvement guidance

---

## Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/digvijaypandit/job-portal-Backend.git
cd job-portal-Backend
```

### Install dependencies
npm install

## Create .env file
Add a .env file in the project root. Example:
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/jobportal?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

# Start the server
npm start

Server will run on http://localhost:5000 by default
## Environment Variables
| Key          | Description                   | Example           |
| ------------ | ----------------------------- | ----------------- |
| `PORT`       | Port number to run backend    | `5000`            |
| `MONGO_URI`  | MongoDB connection string     | *see above*       |
| `JWT_SECRET` | Secret key for JSON Web Token | `your_jwt_secret` |
| `GEMINI_API_KEY` | Secret key for Gemini AI model | `your_gemini_api_key` |


##Available Scripts
| Command       | Description                           |
| ------------- | ------------------------------------- |
| `npm start`   | Run server in production mode         |
| `npm run dev` | Run server with auto-reload (nodemon) |
| `npm test`    | Run test suite (if configured)        |

---
## Technologies Used
- Node.js
- Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT)
- Multer (for file uploads)
- dotenv (for env variables)
- Google Gemini AI API – AI-based feature support
- CORS, Helmet, etc

## Contributing
- Fork the repository
- Create a new branch: git checkout -b feature/my-feature
- Make your changes and commit: git commit -m 'Add some feature'
- Push to the branch: git push origin feature/my-feature
- Open a pull request — you're awesome 🎉

License
This project is MIT licensed — feel free to use it in your projects!
