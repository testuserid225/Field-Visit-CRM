# Field Visit CRM - Node.js Backend API

RESTful API backend for the **Field Visit CRM** application built with Node.js, Express, and MongoDB (Mongoose).

---

## ⚙️ Configuration & Environment

- **Database Connection URI**: `mongodb://127.0.0.1:27017/fieldvisitcrm`
- **Default Port**: `5000`
- **Configuration File**: [backend/.env](file:///e:/ReactJS/field_visit_crm/backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fieldvisitcrm
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

---

## 📁 Directory Structure

```text
backend/
├── config/
│   └── db.js                 # Mongoose connection setup with mongodb://127.0.0.1:27017/fieldvisitcrm
├── controllers/
│   ├── authController.js     # User login, agents list, duty status toggle
│   ├── clientController.js   # Client CRUD management
│   ├── masterController.js   # Master Data CRUD for all 10 masters + dropdown options
│   └── visitController.js    # Field visits schedule, check-in/out, GPS updates
├── models/
│   ├── Client.js             # Client accounts schema
│   ├── MasterModels.js       # Schemas for all 10 masters (Branch, Department, Designation, etc.)
│   ├── User.js               # Representatives, managers, admins schema
│   └── Visit.js              # Field visits schema with GPS telemetry & status
├── routes/
│   ├── authRoutes.js         # /api/auth
│   ├── clientRoutes.js       # /api/clients
│   ├── masterRoutes.js       # /api/masters (CRUD for all 10 masters)
│   ├── statsRoutes.js        # /api/stats
│   └── visitRoutes.js        # /api/visits
├── scripts/
│   ├── seed.js               # Seed users, clients, visits
│   └── seedMasters.js        # Seed all 10 CRM Master tables
├── .env                      # Active environment variables
├── .env.example              # Template environment variables
├── package.json              # Express, Mongoose, Cors, Dotenv dependencies
└── server.js                 # Main server entry file
```

---

## 📡 API Endpoints Reference

### 1. CRM Masters API (`/api/masters`)
Supported `masterType`:
`branches`, `departments`, `designations`, `expense-heads`, `grade-fuel-rates`, `industries`, `principals`, `categories`, `products`, `activity-types`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/masters/:masterType` | View all items for a master (supports `?search=`, `?status=`) |
| `POST` | `/api/masters/:masterType` | Create new master record with validations |
| `PUT` | `/api/masters/:masterType/:id` | Update / edit an existing master record |
| `DELETE`| `/api/masters/:masterType/:id` | Remove a master record |
| `GET` | `/api/masters/meta/dropdowns` | Fetch dynamic options for Principals, Categories, Managers |

### 2. Field Visits (`/api/visits`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/visits` | Get all visits |
| `POST` | `/api/visits` | Schedule new field visit |
| `PUT` | `/api/visits/:id/checkin` | Geo-verified check-in or check-out |
| `DELETE`| `/api/visits/:id` | Remove a visit appointment |

### 3. Authentication & Duty Status (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate credentials |
| `GET` | `/api/auth/users` | List field officers |
| `PATCH`| `/api/auth/users/:userId/duty` | Punch in / Punch out |

---

## 🚀 Running the Backend

### Start Server
```powershell
cd e:\ReactJS\field_visit_crm\backend
npm start
```
