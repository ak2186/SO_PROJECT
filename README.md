# 🏥 HEALIX - Health Monitoring Platform (Backend)

A RESTful API backend for the Healix health monitoring platform, built with Python, FastAPI, and MongoDB.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Overview](#api-overview)
- [Testing with Postman](#testing-with-postman)
- [Google Fit Integration](#google-fit-integration)
- [Chatbot Integration](#chatbot-integration)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.13+** — [Download here](https://www.python.org/downloads/)
- **MongoDB** — [Download here](https://www.mongodb.com/try/download/community)
- **Node.js** (for frontend) — [Download here](https://nodejs.org/)
- **Postman** (for API testing) — [Download here](https://www.postman.com/downloads/)

---

## Installation

**Step 1 — Clone or download the project:**

```bash
cd ~/your-project-folder
```

**Step 2 — Install all Python dependencies:**

```bash
pip3 install -r requirements.txt --break-system-packages
```

**Step 3 — Make sure MongoDB is running:**

```bash
# macOS
brew services start mongodb-community

# Or run directly
mongod
```

---

## Configuration

**Step 1 — Create a `.env` file** in the project root with the following values:

```env
# Application
APP_NAME=Healix
APP_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=healix_db

# JWT
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Encryption
ENCRYPTION_KEY=your_encryption_key_here

# CORS (React frontend)
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Admin Account
ADMIN_EMAIL=admin@healix.com
ADMIN_PASSWORD=Admin123!

# Google Fit OAuth
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:8000/api/googlefit/callback

# Google Gemini (Chatbot)
GEMINI_API_KEY=your_gemini_api_key
```

**Step 2 — Set up Google Fit (optional):**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project called **Healix**
3. Enable the **Fitness API**
4. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
5. Set the redirect URI to: `http://localhost:8000/api/googlefit/callback`
6. Add your Google email as a test user under **OAuth consent screen → Test Users**
7. Copy the Client ID and Client Secret into your `.env` file

**Step 3 — Set up Gemini (optional):**

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key → Create API Key**
3. Copy the key into your `.env` file

---

## Running the Server

**Start the backend:**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Start the frontend (in a separate terminal):**

```bash
cd frontend
npm install
npm run dev
```

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| API Docs (ReDoc) | http://localhost:8000/api/redoc |
| Frontend | http://localhost:5173 |
| Health Check | http://localhost:8000/health |

---

## API Overview

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new account | Public |
| POST | `/api/auth/login` | Login and get JWT token | Public |
| GET | `/api/auth/me` | Get current user info | All roles |
| POST | `/api/auth/logout` | Logout | All roles |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | View all users | Admin |
| POST | `/api/admin/users/provider` | Create provider account | Admin |
| PATCH | `/api/admin/users/{id}/role` | Update user role | Admin |
| DELETE | `/api/admin/users/{id}` | Delete a user | Admin |
| GET | `/api/admin/audit-logs` | View audit logs | Admin |

### Biomarkers
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/biomarkers` | Record a reading | Patient |
| GET | `/api/biomarkers/current` | Get latest readings | Patient, Provider |
| GET | `/api/biomarkers/history` | Get historical data | Patient, Provider |
| GET | `/api/biomarkers/alerts` | Get alert readings | Patient, Provider |

### Google Fit
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/googlefit/connect` | Get Google OAuth URL | Patient |
| GET | `/api/googlefit/callback` | OAuth callback | Public |
| POST | `/api/googlefit/sync` | Sync health data | Patient |

### Appointments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/appointments` | Book an appointment | Patient |
| GET | `/api/appointments/my` | View my appointments | Patient |
| GET | `/api/appointments/provider` | View provider appointments | Provider |
| PATCH | `/api/appointments/{id}/confirm` | Confirm appointment | Provider |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment | All roles |

### Prescriptions
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/prescriptions` | Create prescription | Provider |
| GET | `/api/prescriptions/my` | View my prescriptions | Patient |
| GET | `/api/prescriptions/provider` | View issued prescriptions | Provider |
| POST | `/api/prescriptions/{id}/refill` | Request a refill | Patient |
| PATCH | `/api/prescriptions/{id}/refill/{refill_id}` | Approve/deny refill | Provider |

### Export
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/export/patient/report` | Export my health report (PDF) | Patient |
| GET | `/api/export/provider/patient/{id}` | Export patient report (PDF) | Provider, Admin |

### Chatbot
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/chat` | Send a message | Patient |
| GET | `/api/chat/history` | Get chat history | Patient |
| DELETE | `/api/chat/history` | Clear chat history | Patient |

---

## Testing with Postman

**Step 1 — Register an admin account:**

```
POST http://localhost:8000/api/auth/register
Body:
{
  "email": "admin@healix.com",
  "password": "Admin123!",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin"
}
```

**Step 2 — Login to get a token:**

```
POST http://localhost:8000/api/auth/login
Body:
{
  "email": "admin@healix.com",
  "password": "Admin123!"
}
```

**Step 3 — Use the token:**

In Postman, go to the **Authorization** tab → Type: **Bearer Token** → paste your token.

**Default test accounts:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@healix.com | Admin123! |
| Provider | doctor@healix.com | Doctor123! |
| Patient | patient@healix.com | Patient123! |

---

## Google Fit Integration

**Step 1 — Connect Google Fit (as patient):**

```
GET http://localhost:8000/api/googlefit/connect
Authorization: Bearer <patient_token>
```

Copy the `auth_url` from the response and open it in your browser. Log in with your Google account and grant permissions.

**Step 2 — Sync your data:**

```
POST http://localhost:8000/api/googlefit/sync
Authorization: Bearer <patient_token>
```

This pulls the last 24 hours of health data (heart rate, SpO2, steps, calories) from Google Fit and saves it as biomarker readings.

---

## Chatbot Integration

The chatbot is powered by Google Gemini and has access to the patient's health data for personalized responses.

**Send a message:**

```
POST http://localhost:8000/api/chat
Authorization: Bearer <patient_token>
Body:
{
  "message": "What is my latest heart rate?"
}
```

The chatbot can:
- Answer general health questions
- Explain biomarker readings
- Help with appointments
- Explain prescriptions
- Always advises contacting a doctor for medical concerns

---

## Project Structure

```
SO_PROJECT/
├── app/
│   ├── config/
│   │   ├── settings.py           # Environment configuration
│   │   └── database.py           # MongoDB connection
│   ├── controllers/
│   │   ├── auth_controller.py    # Auth logic
│   │   ├── admin_controller.py   # Admin logic
│   │   ├── biomarker_controller.py
│   │   ├── appointment_controller.py
│   │   ├── prescription_controller.py
│   │   ├── export_controller.py  # PDF generation
│   │   ├── chat_controller.py    # Gemini chatbot
│   │   └── googlefit_controller.py
│   ├── middleware/
│   │   └── auth_middleware.py    # JWT verification
│   ├── models/
│   │   ├── user.py
│   │   ├── audit_log.py
│   │   ├── biomarker.py
│   │   ├── appointment.py
│   │   ├── prescription.py
│   │   └── chat.py
│   ├── routes/
│   │   ├── auth_routes.py
│   │   ├── admin_routes.py
│   │   ├── biomarker_routes.py
│   │   ├── appointment_routes.py
│   │   ├── prescription_routes.py
│   │   ├── export_routes.py
│   │   ├── chat_routes.py
│   │   └── googlefit_routes.py
│   └── main.py                   # FastAPI app entry point
├── frontend/                     # React + Vite frontend
├── .env                          # Environment variables
├── requirements.txt              # Python dependencies
└── README.md
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Language | Python 3.13 |
| Framework | FastAPI |
| Database | MongoDB |
| ODM | Motor (async) |
| Auth | JWT + Argon2 |
| Health Data | Google Fit API |
| AI Chatbot | Google Gemini |
| PDF Export | ReportLab |
| Frontend | React + Vite |