# Vairavan Kovil — Temple Management System

Full-stack application built for **Vairavan Kovil (Nagarathar Dharma Paripalana Sabai)** with comprehensive staff administration, devotee booking registration, WhatsApp intimation campaigns, Tamil bilingual support, and automated attendance tracking.

GitHub Repository: [https://github.com/marlinabishak/Vairavan_Koil.git](https://github.com/marlinabishak/Vairavan_Koil.git)

---

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS (fully responsive with custom mobile viewports and touch-friendly layouts).
- **Backend**: Node.js + Express + Helmet + CORS + JWT.
- **Database**: MySQL / MariaDB (via `mysql2/promise` with automatic parameterized query translation).
- **Integrations**: 
  - **Razorpay**: Online payments for kattalai devotee registrations.
  - **AskEva (Blackpond API)**: Automated WhatsApp campaign messages (English & Tamil templates).

---

## Project Structure
```
vairavan-kovil/
├── backend/
│   ├── src/
│   │   ├── controllers/        # auth, bookings, dropdowns, history, kattalaiTypes, panchangam, todos
│   │   ├── db/
│   │   │   ├── pool.js         # MySQL connection pool with query adapter
│   │   │   ├── schema.mysql.sql# Full MySQL database schema
│   │   │   ├── seed.js         # Initial data seeding
│   │   │   └── vairavan_koil_backup.sql # Complete DB backup with all initial records
│   │   ├── middleware/         # authMiddleware (JWT role checking)
│   │   ├── routes/             # Express API routes
│   │   └── server.js           # Server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # Dynamic API client supporting window.__API_URL__
│   │   ├── components/         # BookingModal, Combobox, TamilDetailsModal, WhatsAppSendModal, etc.
│   │   ├── context/            # AuthContext (JWT management & role persistence)
│   │   ├── pages/              # Login, Signup, Dashboard, Profiles, Settings, History, WhatsAppDashboard
│   │   ├── layouts/            # MainLayout (background positioning & mobile viewport clamping)
│   │   └── App.jsx             # React Router routing configuration
│   ├── public/                 # Static assets & .htaccess
│   ├── index.html              # HTML shell with viewport locking & live API hook
│   └── package.json
├── deployment.md               # Production deployment guide (Hostinger + Render)
├── guidance.md                 # System architecture, developer guide, and RBAC matrix
└── README.md                   # This documentation
```

---

## Local Setup

### 1. Database Setup (MySQL)
1. Ensure MySQL (e.g. XAMPP or native MySQL) is running.
2. Create database `Vairavan_koil`:
   ```sql
   CREATE DATABASE Vairavan_koil CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the database schema or backup:
   ```bash
   mysql -u root -p Vairavan_koil < backend/src/db/schema.mysql.sql
   ```
   *(Or import `backend/src/db/vairavan_koil_backup.sql` directly via phpMyAdmin).*

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure DB credentials in .env:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=Vairavan_koil
npm run dev          # Runs on http://localhost:4000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Runs on http://localhost:5173
```

---

## Role-Based Access Control (RBAC)
- **Super Admin (`superadmin`)**: Complete system access, slot configuration, user profiles management, and 5-day lock override. *(Initial Password: `Spon`)*
- **Admin (`admin`)**: Booking management, attendee tracking, and WhatsApp campaign triggers within the active window.
- **Ulthurai (`ulthurai`)**: Temple pooja team; can only toggle attendance (Present / Absent) for today's poojas.
- **Supporter (`supporter`)**: Staff support with read and operational assistance.
- **Devotee (`user`)**: Logs in using their unique `Office Code` and `Mobile Number`. Can view their Kattalai bookings and attendance history.

---

## Deployment Summary
- **Frontend**: Deployed to Hostinger `public_html/` with `.htaccess` rewrite rules.
- **Backend API**: Deployed to Render.com connected to Hostinger Remote MySQL.
- **Database**: Hostinger MySQL managed via phpMyAdmin.

*For complete deployment details, refer to `deployment.md`.*
