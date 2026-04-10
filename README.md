# HEALIX — Health Monitoring Platform

A full-stack health monitoring web application with patient, provider, and admin dashboards.

**Live App:** [https://frontend-a6x3.onrender.com](https://frontend-a6x3.onrender.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas |
| Auth | JWT + Argon2 password hashing |
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| AI Assistant | Google Gemini API |
| Health Data | Google Fit REST API |
| PDF Export | ReportLab |

---

## Default Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@healix.com | Admin123! |
| Doctor | sarah.johnson@healix.com | Doctor@123 |
| Doctor | james.chen@healix.com | Doctor@123 |
| Doctor | priya.patel@healix.com | Doctor@123 |
| Patient | *(register at login page)* | 8+ chars, 1 uppercase, 1 number |

---

## Features

### Patient
- Health Dashboard — heart rate, SpO2, steps, calories
- Google Fit Integration — auto-syncs health data on login
- Vitals — biomarker history and trends
- Goals — set and track health goals
- Appointments — browse doctors by specialty, book and cancel
- Prescriptions — view medications, add own, request refills
- AI Assistant — Gemini-powered chat with access to your health data
- Notifications — appointment reminders and prescription alerts

### Provider (Doctor)
- Patient List — view assigned patients
- Appointments — confirm or cancel patient requests
- Prescriptions — create prescriptions, approve/deny refill requests

### Admin
- User Management — create/delete users, change roles
- All Appointments and Prescriptions — system-wide view
- Audit Logs — track admin actions

---

## Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend
```bash
git clone <repo-url>
cd SO_PROJECT
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at [http://localhost:5173](http://localhost:5173)

---

## API Docs

Swagger UI available at: [https://so-project.onrender.com/api/docs](https://so-project.onrender.com/api/docs)
