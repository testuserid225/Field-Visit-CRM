# Field Visit CRM (Enterprise Field Workforce & Visit Management)

A modern, responsive React web application built for field sales executives, service engineers, and territory managers to schedule, execute geo-fenced check-ins, track live GPS routes, and report visit outcomes.

---

## 🚀 Key Features

- **Authentication & Login Portal (`src/pages/LoginPage.jsx`)**:
  - Role-based sign-in (Senior Field Officer, Territory Sales Manager, CRM Administrator).
  - Password visibility toggle, remember-me options, and demo credential quick-fill buttons.
- **Executive Dashboard (`src/pages/DashboardPage.jsx`)**:
  - Key performance metrics (Total Visits, Completed, Distance Traveled, Geo-Accuracy).
  - Shift start/end (Punch In / Punch Out) control.
  - Interactive today's itinerary list and Live GPS Radar simulation.
- **Field Visits Management (`src/pages/VisitsPage.jsx`)**:
  - Filter by status (*All, Scheduled, In-Progress, Completed*) and priority (*High, Medium, Low*).
  - Search visits by client, person, or location.
  - Geo-verified check-in / check-out modal with site photo verification simulation.
- **Client & Accounts Directory (`src/pages/ClientsPage.jsx`)**:
  - Client profiles across Healthcare, Retail, Logistics, Manufacturing, and Agri-Tech.
  - Direct visit scheduling from client card.
  - Add Client modal with validation.
- **Live GPS & Route Tracker (`src/pages/LiveTrackerPage.jsx`)**:
  - Real-time telemetry coordinates, speed, and signal status.
  - Route waypoint timeline following field agent activity throughout the day.
- **Performance & Reports (`src/pages/ReportsPage.jsx`)**:
  - Weekly visits throughput charts and client category breakdowns.
  - Instant one-click CSV report export.

---

## 📁 Project Structure

```text
field_visit_crm/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── CheckInModal.jsx
│   │   ├── Navbar.jsx
│   │   ├── ScheduleModal.jsx
│   │   ├── Sidebar.jsx
│   │   └── VisitDetailsModal.jsx
│   ├── data/
│   │   └── mockData.js
│   ├── pages/
│   │   ├── ClientsPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── LiveTrackerPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── VisitsPage.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Demo Credentials
- **Field Rep**: `imran@fieldvisitcrm.com` / `password123`
- **Manager**: `sarah@fieldvisitcrm.com` / `password123`
- Or click the **One-Click Demo Agents** buttons on the login screen.
