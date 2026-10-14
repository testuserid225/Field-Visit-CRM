# 🏗️ Field Visit CRM - Microservices Architecture Guide

This document outlines the **Microservices Architecture** implemented for the Field Visit CRM, detailing the API Gateway, individual microservices, port allocations, route maps, and operational commands.

---

## 🏛️ Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              React Frontend                  │
                      │         (http://localhost:5173)              │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP Requests (/api/*)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │                 API GATEWAY                  │
                      │            (Port 5000 / Proxy)               │
                      └───────┬──────────┬───────────┬───────────────┘
                              │          │           │               │
       /api/auth, /api/employees         │           │               │
                              │          │           │               │
                              ▼          │           │               │
            ┌─────────────────────┐      │           │               │
            │     Auth Service    │      │           │               │
            │     (Port 5001)     │      │           │               │
            └─────────────────────┘      ▼           │               │
                      /api/visits, /api/daily-visit-expenses         │
                      /api/stats                             │       │
                                 ┌───────────────────────┐   │       │
                                 │ Visit & Ops Service   │   │       │
                                 │ (Port 5002)           │   │       │
                                 └───────────────────────┘   ▼       │
                                       /api/clients, /api/customers, │
                                       /api/opportunities,           │
                                       /api/quotations,              │
                                       /api/contact-persons          │
                                                 ┌───────────────────┴───┐
                                                 │ Sales & CRM Service   │
                                                 │ (Port 5003)           │
                                                 └───────────────────────┘
                                                                     │
                                                             /api/masters
                                                                     │
                                                                     ▼
                                                 ┌───────────────────────┐
                                                 │  Master Data Service  │
                                                 │  (Port 5004)          │
                                                 └───────────────────────┘
```

---

## 🔌 Service Port & Responsibility Matrix

| Service | Port | Directory | Domain & Responsibilities | Key Routes |
|---|---|---|---|---|
| **API Gateway** | `5000` | [`services/gateway`](file:///e:/ReactJS/field_visit_crm/services/gateway/server.js) | Central Reverse Proxy, Health Check Aggregation, CORS | `/api/health`, `/` |
| **Auth & Employee Service** | `5001` | [`services/auth-service`](file:///e:/ReactJS/field_visit_crm/services/auth-service/server.js) | Authentication, JWT, TOTP 2FA, Security Roles, Employee CRUD | `/api/auth/*`, `/api/employees/*` |
| **Visit & Ops Service** | `5002` | [`services/visit-service`](file:///e:/ReactJS/field_visit_crm/services/visit-service/server.js) | Field Visits, GPS Telemetry, Daily Expense Claims, Dashboard KPIs | `/api/visits/*`, `/api/daily-visit-expenses/*`, `/api/stats/*` |
| **Sales & CRM Service** | `5003` | [`services/sales-service`](file:///e:/ReactJS/field_visit_crm/services/sales-service/server.js) | Clients, Customers, Contacts, Deals/Opportunities, Quotations & Gmail SMTP | `/api/clients/*`, `/api/customers/*`, `/api/opportunities/*`, `/api/quotations/*` |
| **Master Data Service** | `5004` | [`services/master-service`](file:///e:/ReactJS/field_visit_crm/services/master-service/server.js) | 10 CRM Master Tables (Branches, Departments, Products, Expense Heads, etc.) | `/api/masters/*` |

---

## 🚀 How to Run Microservices

### 1. Run ALL Microservices + Gateway (1 Single Command)
```bash
npm run services:all
```
This boots all 4 microservices + the central API Gateway simultaneously with synchronized colored logging.

### 2. Run Entire Stack (Frontend + All Microservices)
```bash
npm run dev:full
```
Runs the Vite React frontend (`http://localhost:5173`) and all microservices concurrently.

### 3. Run Microservices Individually (Isolated Development)
You can start any microservice independently on its designated port:
```bash
# Start API Gateway (Port 5000)
npm run start:gateway

# Start Auth & Employee Service (Port 5001)
npm run start:auth

# Start Visit & Operations Service (Port 5002)
npm run start:visit

# Start Sales & CRM Service (Port 5003)
npm run start:sales

# Start Master Data Service (Port 5004)
npm run start:master
```

---

## 🩺 Health Check & Monitoring

The API Gateway provides a unified health endpoint that checks all microservices in parallel:

**Request**:
```http
GET http://localhost:5000/api/health
```

**Response**:
```json
{
  "gateway": "UP",
  "port": 5000,
  "architecture": "Microservices with API Gateway",
  "overallStatus": "ALL_SERVICES_HEALTHY",
  "services": {
    "authService": {
      "name": "Auth & Employee Service",
      "url": "http://127.0.0.1:5001",
      "status": "UP",
      "code": 200
    },
    "visitService": {
      "name": "Visit & Operations Service",
      "url": "http://127.0.0.1:5002",
      "status": "UP",
      "code": 200
    },
    "salesService": {
      "name": "Sales & Quotation Service",
      "url": "http://127.0.0.1:5003",
      "status": "UP",
      "code": 200
    },
    "masterService": {
      "name": "Master Data Service",
      "url": "http://127.0.0.1:5004",
      "status": "UP",
      "code": 200
    }
  },
  "timestamp": "2026-10-14T13:40:00.000Z"
}
```

---

## 🛡️ Resilience & Fault Tolerance

If an individual microservice goes down or is restarting:
- The API Gateway does **NOT** crash.
- It immediately returns a clean, structured `503 Service Unavailable` response with details about which specific service is offline and troubleshooting instructions.
- Other healthy microservices continue handling traffic without disruption.
