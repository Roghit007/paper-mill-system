# Paper Mill Management System

A full-stack web application for running a paper mill: machines, production, quality inspections,
maintenance scheduling and waste tracking, with a live dashboard, rule-based alerts, management
reports and role-based access control.

**Stack:** React · Express · MongoDB (local, via Mongoose) · JWT authentication · Recharts

## Features
- **Dashboard** with animated KPI cards, charts, machine availability and rule-based alerts
  (efficiency, rejection rate, failed inspections per machine, overdue maintenance, downtime)
- **Modules:** Machines, Production, Quality, Maintenance, Waste — add, edit and delete records
- **Quality inspections are linked to machines**, so alerts name the machine at fault
- **Reports** page with date-range presets, per-section CSV download and Print / Save as PDF
- **Export CSV** on every list (respects the current search and date filters)
- Search, date-range filters and pagination on every list
- Login with 8-hour JWT sessions and three roles (admin, operator, inspector)
- Admin user management: create, edit, reset password, delete
- Light and dark theme, responsive layout (desktop, tablet, phone)
- Security: bcrypt passwords, helmet headers, CORS allow-list, login rate limiting,
  request sanitising and server-side validation

## Requirements
- [Node.js](https://nodejs.org) 18 or newer
- [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally
  (install it as a Windows service; MongoDB Compass is optional)

## Setup

### 1. Server
```
cd server
npm install
```
Create `server/.env` (see `server/.env.example`):
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/papermill
JWT_SECRET=<random string, 32+ characters>
CLIENT_ORIGIN=http://localhost:3000
ADMIN_NAME=Administrator
ADMIN_EMAIL=admin@yourmill.com
ADMIN_PASSWORD=<choose a password, min 8 characters>
```
Create the first admin account, then **delete the `ADMIN_PASSWORD` line from `.env`**:
```
node seedAdmin.js
```
Optional: load demo data (machines, production, quality, maintenance, waste, plus operator and
inspector accounts):
```
node seedDemo.js            # run once
node seedDemo.js --reset    # replace the demo data (users are never deleted)
```
Start the server:
```
npm start
```

### 2. Client
```
cd client
npm install
```
Create `client/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```
```
npm start
```
Open http://localhost:3000 and sign in.

### Demo accounts (created by `seedDemo.js`)
| Role | Email | Password |
|---|---|---|
| Admin | the email you set in `ADMIN_EMAIL` | the password you set in `ADMIN_PASSWORD` |
| Operator | operator@yourmill.com | Demo@1234 |
| Inspector | inspector@yourmill.com | Demo@1234 |

Change the demo passwords on the **Users** page before sharing the project.

## Roles
| Module | Read | Create / Edit | Delete |
|---|---|---|---|
| Machines | All | Admin | Admin |
| Production | All | Admin, Operator | Admin |
| Maintenance | All | Admin, Operator | Admin |
| Quality | All | Admin, Inspector | Admin |
| Waste | All | Admin, Inspector | Admin |
| Reports | All | – | – |
| Users | Admin | Admin | Admin (not self, not the last admin) |

## Project structure
```
server/
  config/        database connection
  controllers/   business logic, alerts engine, reports
  middleware/    auth (JWT + roles), sanitize
  models/        Mongoose schemas
  routes/        API routes
  utils/         shared helpers
  seedAdmin.js   creates the first admin
  seedDemo.js    loads demo data
client/src/
  components/    Sidebar, AlertsPanel, DashboardCharts, ListTools, ToastHost, CountUp
  context/       AuthContext (user + permission helper)
  pages/         Login, Dashboard, one page per module, Reports
  services/      axios instance (api.js)
  styles/        shared inline styles + theme.css (design tokens)
  utils/         useListView (search / filter / pagination), csv helpers
```

## API overview
All routes except `POST /api/auth/login` need `Authorization: Bearer <token>`.

| Route | Purpose |
|---|---|
| `POST /api/auth/login`, `GET /api/auth/me` | Login, current user |
| `/api/machines` `/production` `/quality` `/maintenance` `/waste` | CRUD (GET, POST, PUT /:id, DELETE /:id) |
| `GET /api/production/summary`, `/quality/summary`, `/waste/summary`, `/maintenance/due` | Dashboard data |
| `GET /api/alerts` | Rule-based alerts |
| `GET /api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD` | Management report for a date range |
| `/api/users` | Admin-only user management |

## Alert rules
Thresholds are in `server/controllers/alertController.js` (`THRESHOLDS`): efficiency below 80%
(critical below 60%), rejection above 5%, failed inspections in the last 7 days (one alert per
machine, critical at 2 or more), overdue maintenance, and downtime above 20% of total time.

## Security notes
- Never commit or share `.env`.
- Use a long random `JWT_SECRET`.
- Delete `ADMIN_PASSWORD` from `.env` after creating the first admin.