# HEALIX - Health Monitoring Platform

A full-stack health monitoring web application with patient, provider, and admin dashboards. Built with **FastAPI** (Python) + **React** (Vite) + **MongoDB**.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Seed Dummy Doctors](#seed-dummy-doctors)
- [Running the Application](#running-the-application)
- [Default Accounts](#default-accounts)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [File Explanations](#file-explanations)
- [Google Fit Setup](#google-fit-setup)
- [Gemini AI Setup](#gemini-ai-setup)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have the following installed:

- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** — [Download](https://nodejs.org/)
- **MongoDB** — [Download](https://www.mongodb.com/try/download/community) (local install or [MongoDB Atlas](https://www.mongodb.com/atlas) cloud)
- **Git** — [Download](https://git-scm.com/)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repo-url>
cd SO_PROJECT
```

### 2. Backend Setup

```bash
# Create a virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate          # Windows

# Install all Python dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

## Configuration

### Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
# Application
APP_NAME=HEALIX
APP_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=8000

# MongoDB
MONGODB_URL=mongodb://localhost:27017       # or your Atlas URI
MONGODB_DB_NAME=healix_db

# JWT (change the secret key!)
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Encryption
ENCRYPTION_KEY=your_encryption_key_here

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECONDS=60

# Admin Account (auto-created on first run)
ADMIN_EMAIL=admin@healix.com
ADMIN_PASSWORD=Admin123!

# Google Fit OAuth (optional — for health data sync)
GOOGLE_FIT_CLIENT_ID=your_google_fit_client_id
GOOGLE_FIT_CLIENT_SECRET=your_google_fit_client_secret
GOOGLE_FIT_REDIRECT_URI=http://localhost:8000/api/googlefit/callback

# Google Gemini (optional — for AI chat assistant)
GEMINI_API_KEY=your_gemini_api_key
```

---

## Seed Dummy Doctors

To populate the database with 5 test doctor accounts:

```bash
source .venv/bin/activate
python3 seed_doctors.py
```

This creates these providers:

| Doctor | Email | Specialty | Hours | Days |
|---|---|---|---|---|
| Sarah Johnson | sarah.johnson@healix.com | General Practice | 9:00 AM - 5:00 PM | Mon - Fri |
| James Chen | james.chen@healix.com | Cardiology | 8:00 AM - 4:00 PM | Mon - Fri |
| Priya Patel | priya.patel@healix.com | Dermatology | 10:00 AM - 6:00 PM | Mon - Sat |
| Michael Rodriguez | michael.rodriguez@healix.com | Orthopedics | 7:00 AM - 3:00 PM | Mon - Fri |
| Emily Williams | emily.williams@healix.com | Pediatrics | 9:00 AM - 5:00 PM | Mon - Fri |

**Password for all doctors:** `Doctor@123`

Running the script again will skip existing accounts (safe to re-run).

---

## Running the Application

You need **two terminals** running simultaneously:

### Terminal 1 — Backend (FastAPI)

```bash
cd SO_PROJECT
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 — Frontend (React + Vite)

```bash
cd SO_PROJECT/frontend
npm run dev
```

### Access Points

| Service | URL |
|---|---|
| **Frontend App** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **Swagger API Docs** | http://localhost:8000/api/docs |
| **ReDoc API Docs** | http://localhost:8000/api/redoc |
| **Health Check** | http://localhost:8000/health |

> The Vite dev server automatically proxies all `/api` requests to the backend on port 8000.

---

## Default Accounts

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@healix.com | Admin123! | Set in `.env`, auto-created on first run |
| Provider | sarah.johnson@healix.com | Doctor@123 | Created via `seed_doctors.py` |
| Patient | *(register at login page)* | *(your choice)* | Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number |

---

## Features

### Patient Features
- **Health Dashboard** — Real-time heart rate, SpO2, steps, and calories cards
- **Google Fit Integration** — Auto-syncs health data from Google Fit on login (supports Apple Watch via Google Fit app)
- **Vitals Page** — Detailed biomarker history and trends
- **Goals** — Set and track health goals
- **Appointments** — Browse doctors by specialty/availability, book appointments, cancel
- **Prescriptions** — View doctor-prescribed medications, add own existing medications ("Self-added" badge), request refills
- **AI Assistant** — Chat with Gemini-powered health assistant that has access to your health data
- **Profile Setup** — First-time wizard to fill in health details (age, gender, blood type, height, weight, emergency contact, etc.)
- **Settings** — Edit all personal details, manage Google Fit connection
- **Notifications** — Bell icon in navbar showing appointment reminders, prescription alerts, etc.

### Provider (Doctor) Features
- **Patient List** — View assigned patients
- **Appointments** — Confirm or cancel patient appointments
- **Prescriptions** — Create prescriptions for patients, approve/deny refill requests
- **Settings** — Update profile

### Admin Features
- **User Management** — View all users, create provider accounts, change roles, delete users
- **All Appointments** — View every appointment in the system
- **All Prescriptions** — View every prescription in the system
- **Audit Logs** — Track admin actions for compliance
- **Settings** — Update profile

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Register a new account | Public |
| POST | `/api/auth/login` | Login and get JWT token | Public |
| GET | `/api/auth/me` | Get current user profile | All |
| PUT | `/api/auth/profile` | Update profile details | All |
| POST | `/api/auth/logout` | Logout | All |

### Appointments (`/api/appointments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/appointments/providers` | List doctors with specialty & hours | Patient |
| POST | `/api/appointments` | Book an appointment | Patient |
| GET | `/api/appointments/my` | Get my appointments | Patient |
| GET | `/api/appointments/provider` | Get my patient appointments | Provider |
| PATCH | `/api/appointments/{id}/confirm` | Confirm appointment | Provider |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment | All |

### Prescriptions (`/api/prescriptions`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/prescriptions` | Create a prescription | Provider |
| POST | `/api/prescriptions/self` | Add own existing medication | Patient |
| GET | `/api/prescriptions/my` | Get my prescriptions | Patient |
| GET | `/api/prescriptions/provider` | Get prescriptions I wrote | Provider |
| POST | `/api/prescriptions/{id}/refill` | Request a refill | Patient |
| PATCH | `/api/prescriptions/{id}/refill/{refillId}` | Approve/deny refill | Provider |

### Biomarkers (`/api/biomarkers`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/biomarkers` | Record a biomarker reading | Patient |
| GET | `/api/biomarkers/current` | Get latest readings | Patient |
| GET | `/api/biomarkers/history` | Get historical data | Patient |
| GET | `/api/biomarkers/alerts` | Get alert readings | Patient |

### Google Fit (`/api/googlefit`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/googlefit/connect` | Start OAuth flow (returns auth URL) | Patient |
| GET | `/api/googlefit/callback` | OAuth callback (Google redirects here) | Public |
| POST | `/api/googlefit/sync` | Sync latest data from Google Fit | Patient |
| GET | `/api/googlefit/today` | Get today's cached data | Patient |

### AI Chat (`/api/chat`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/chat` | Send message to AI assistant | Patient |
| GET | `/api/chat/history` | Get chat history | Patient |
| DELETE | `/api/chat/history` | Clear chat history | Patient |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/notifications` | Get all notifications (optional `?unread_only=true`) | All |
| PATCH | `/api/notifications/{id}/read` | Mark one notification as read | All |
| PATCH | `/api/notifications/read-all` | Mark all as read | All |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/admin/users` | List all users | Admin |
| POST | `/api/admin/users/provider` | Create a provider account | Admin |
| PATCH | `/api/admin/users/{id}/role` | Change user role | Admin |
| DELETE | `/api/admin/users/{id}` | Delete a user | Admin |
| GET | `/api/admin/audit-logs` | View audit logs | Admin |
| GET | `/api/admin/appointments` | View all appointments | Admin |
| GET | `/api/admin/prescriptions` | View all prescriptions | Admin |

---

## Project Structure

```
SO_PROJECT/
│
├── app/                              # ========== BACKEND (FastAPI) ==========
│   ├── main.py                       # App entry point — creates FastAPI app, registers routes, CORS, lifespan
│   │
│   ├── config/
│   │   ├── settings.py               # Loads all config from .env using Pydantic Settings
│   │   └── database.py               # MongoDB connection manager (Motor async driver)
│   │
│   ├── models/                       # Pydantic schemas — define request/response data shapes
│   │   ├── user.py                   # User, UserCreate, UserLogin, UserUpdate, Token schemas
│   │   ├── appointment.py            # Appointment create/response schemas
│   │   ├── prescription.py           # Prescription, SelfPrescription, RefillRequest schemas
│   │   ├── biomarker.py              # Biomarker recording schemas
│   │   ├── notification.py           # Notification create/response schemas
│   │   ├── chat.py                   # Chat message schemas
│   │   └── audit_log.py              # Audit log schemas
│   │
│   ├── controllers/                  # Business logic — called by routes
│   │   ├── auth_controller.py        # Register, login, JWT creation, profile updates
│   │   ├── admin_controller.py       # User CRUD, provider creation, audit logs
│   │   ├── appointment_controller.py # Book/cancel/confirm appointments, list providers
│   │   ├── prescription_controller.py# Create prescriptions, self-meds, refill management
│   │   ├── biomarker_controller.py   # Record and retrieve health readings
│   │   ├── googlefit_controller.py   # Google Fit OAuth flow + data sync (HR, SpO2, steps, calories)
│   │   ├── chat_controller.py        # Gemini AI chat with patient health context
│   │   └── notification_controller.py# Create, fetch, mark-read notifications
│   │
│   ├── routes/                       # API route definitions — thin layer that calls controllers
│   │   ├── auth_routes.py            # /api/auth/*
│   │   ├── admin_routes.py           # /api/admin/*
│   │   ├── appointment_routes.py     # /api/appointments/*
│   │   ├── prescription_routes.py    # /api/prescriptions/*
│   │   ├── biomarker_routes.py       # /api/biomarkers/*
│   │   ├── googlefit_routes.py       # /api/googlefit/*
│   │   ├── chat_routes.py            # /api/chat/*
│   │   └── notification_routes.py    # /api/notifications/*
│   │
│   ├── middleware/
│   │   └── auth_middleware.py        # JWT token extraction, verification, role-based access (require_role)
│   │
│   └── utils/
│       ├── jwt.py                    # JWT token creation (sign) and verification (decode)
│       ├── password.py               # Password hashing and verification (Argon2)
│       └── audit_logger.py           # Logs admin actions to audit_logs collection
│
├── frontend/                         # ========== FRONTEND (React + Vite) ==========
│   ├── index.html                    # HTML entry point
│   ├── vite.config.js                # Vite config — dev server proxy (/api → localhost:8000)
│   ├── package.json                  # Node dependencies and scripts
│   │
│   └── src/
│       ├── main.jsx                  # React DOM render entry point
│       ├── App.jsx                   # All route definitions (React Router v6)
│       ├── global.css                # Global base styles
│       │
│       ├── utils/
│       │   └── api.js                # API client — fetch wrapper with JWT auth headers
│       │                             #   Exports: authAPI, appointmentsAPI, prescriptionsAPI,
│       │                             #   biomarkersAPI, googleFitAPI, chatAPI, adminAPI, notificationsAPI
│       │
│       ├── context/
│       │   └── AuthContext.jsx       # React context for auth state (user, login, logout, refreshUser)
│       │                             #   Wraps entire app, persists JWT in localStorage
│       │
│       ├── components/
│       │   ├── Layout.jsx            # Page layout wrapper — renders Navbar + page content (Outlet)
│       │   ├── Navbar.jsx            # Top navigation bar with links, role badge, notification bell, logout
│       │   ├── ProtectedRoute.jsx    # Route guard — checks auth + optional role requirement, redirects to /login
│       │   └── SegmentedToggle.jsx   # Reusable segmented control / toggle component
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.jsx         # Login + Registration page (tabbed interface)
│       │   │   └── Signup.jsx        # Redirects to Login page
│       │   │
│       │   ├── patient/
│       │   │   ├── Landing.jsx       # Post-login landing page — auto Google Fit sync in background
│       │   │   ├── Dashboard.jsx     # Health metrics cards (heart rate, SpO2, steps, calories)
│       │   │   ├── Vitals.jsx        # Detailed vitals view with biomarker history charts
│       │   │   ├── Goals.jsx         # Health goals setting and tracking
│       │   │   ├── Appointments.jsx  # View/book/cancel appointments — doctor cards with specialty & hours
│       │   │   ├── Prescriptions.jsx # View prescriptions + "Add My Medication" modal for self-meds
│       │   │   ├── Assistant.jsx     # AI chat assistant powered by Gemini
│       │   │   ├── Settings.jsx      # Profile settings — all personal/health/emergency fields editable
│       │   │   ├── ProfileSetup.jsx  # First-time profile completion wizard (redirects from login)
│       │   │   ├── assistant.css     # Styles for the AI assistant page
│       │   │   └── goals.css         # Styles for the goals page
│       │   │
│       │   ├── provider/
│       │   │   ├── Dashboard.jsx     # Provider landing (redirects to patients)
│       │   │   ├── PatientList.jsx   # View and search assigned patients
│       │   │   ├── Appointments.jsx  # Manage appointments (confirm/cancel incoming requests)
│       │   │   ├── Prescriptions.jsx # Create prescriptions, approve/deny refill requests
│       │   │   └── Settings.jsx      # Provider profile settings
│       │   │
│       │   └── admin/
│       │       ├── Dashboard.jsx     # User management — create/delete users, change roles, create providers
│       │       ├── Appointments.jsx  # View all appointments across the entire system
│       │       ├── Prescriptions.jsx # View all prescriptions across the entire system
│       │       └── Settings.jsx      # Admin profile settings
│       │
│       ├── data/
│       │   └── vitalsMock.js         # Mock data for vitals charts/graphs
│       │
│       └── assets/
│           └── logo.png              # HEALIX logo
│
├── seed_doctors.py                   # Script to seed 5 dummy doctor accounts into MongoDB
├── requirements.txt                  # Python dependencies
├── .env.example                      # Environment variable template (safe to commit)
├── .env                              # Your local environment config (DO NOT commit)
└── README.md                         # This file
```

---

## File Explanations

### Backend — How it all connects

1. **`app/main.py`** — The entry point. Creates the FastAPI app, sets up CORS, connects to MongoDB on startup, registers all route modules.

2. **`app/config/settings.py`** — Uses Pydantic Settings to load everything from `.env`. Import `settings` anywhere to access config values.

3. **`app/config/database.py`** — MongoDB connection using Motor (async driver). Call `Database.get_db()` in any controller to get the database instance.

4. **`app/middleware/auth_middleware.py`** — Extracts the JWT from the `Authorization: Bearer <token>` header, verifies it, and returns the current user. Also provides `require_role()` to restrict endpoints to specific roles.

5. **Routes (`app/routes/`)** — Define API endpoints. Each route file is a FastAPI `APIRouter`. Routes are thin — they validate input, call the controller, and return the response.

6. **Controllers (`app/controllers/`)** — Contain all business logic. Controllers interact with MongoDB, process data, and return results. This keeps routes clean.

7. **Models (`app/models/`)** — Pydantic schemas that define what data looks like. Used for request validation (what the client sends) and response serialization (what the API returns).

### Frontend — How it all connects

1. **`frontend/src/main.jsx`** — Renders `<App />` into the DOM.

2. **`frontend/src/App.jsx`** — Defines all routes using React Router v6. Every page is wrapped in `<ProtectedRoute>` with an optional `role` prop.

3. **`frontend/src/context/AuthContext.jsx`** — Provides `user`, `login()`, `logout()`, and `refreshUser()` to the entire app. On mount, it checks for a stored JWT token and fetches the user profile.

4. **`frontend/src/utils/api.js`** — Central API client. All backend calls go through this. Automatically attaches the JWT token to every request. If the token is invalid, it clears it.

5. **`frontend/src/components/Navbar.jsx`** — Shows navigation links based on the user's role, a role badge, a notification bell with dropdown (fetches every 30s), and a logout button.

6. **`frontend/src/components/ProtectedRoute.jsx`** — If the user isn't logged in, redirects to `/login`. If a `role` prop is specified and doesn't match, redirects to the correct dashboard.

7. **`frontend/vite.config.js`** — The Vite proxy config ensures that all `/api` requests from the frontend (port 5173) are forwarded to the backend (port 8000), avoiding CORS issues in development.

---

## Google Fit Setup

To enable Google Fit health data syncing:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable the **Fitness API**
4. Go to **APIs & Services > Credentials > Create OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:8000/api/googlefit/callback`
5. Go to **OAuth consent screen > Test Users** and add your Google email
6. Copy the **Client ID** and **Client Secret** into your `.env`:
   ```
   GOOGLE_FIT_CLIENT_ID=your_client_id
   GOOGLE_FIT_CLIENT_SECRET=your_client_secret
   ```

Once configured, patients can connect Google Fit from their Settings page. Data syncs automatically on every login.

**Supported metrics:** Heart Rate, Blood Oxygen (SpO2), Steps, Calories

---

## Gemini AI Setup

To enable the AI health assistant:

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Click **Get API Key > Create API Key**
3. Copy the key into your `.env`:
   ```
   GEMINI_API_KEY=your_api_key
   ```

The assistant has access to the patient's health data and can answer questions about their readings, prescriptions, and general health.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.10+) |
| Database | MongoDB (Motor async driver) |
| Auth | JWT (python-jose) + Argon2 password hashing |
| Frontend | React 18 + Vite 5 |
| Routing | React Router v6 |
| AI Assistant | Google Gemini API |
| Health Data | Google Fit REST API |
| Styling | Inline CSS-in-JS (dark theme) |
| PDF Export | ReportLab |

---

## Troubleshooting

**MongoDB not connecting:**
- Make sure MongoDB is running: `brew services start mongodb-community` (macOS) or `mongod` (manual)
- If using Atlas, check your connection string and whitelist your IP

**Frontend shows blank page or API errors:**
- Make sure BOTH terminals are running (backend on 8000, frontend on 5173)
- Check the browser console for errors

**"CORS error" in browser:**
- Make sure `ALLOWED_ORIGINS` in `.env` includes `http://localhost:5173`

**Google Fit not syncing:**
- Verify your OAuth credentials in `.env`
- Make sure your Google email is added as a test user in the OAuth consent screen
- The redirect URI must exactly match: `http://localhost:8000/api/googlefit/callback`

**AI chat not responding:**
- Check that `GEMINI_API_KEY` is set in `.env`
- Make sure the key is valid at [Google AI Studio](https://aistudio.google.com)

**`seed_doctors.py` fails:**
- Make sure `.env` is configured and MongoDB is running
- Activate your virtual environment first: `source .venv/bin/activate`

**Password validation errors on registration:**
- Password must be 8-72 characters, contain at least 1 uppercase letter, 1 lowercase letter, and 1 number
