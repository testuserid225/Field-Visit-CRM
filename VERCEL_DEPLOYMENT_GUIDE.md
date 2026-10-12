# 🚀 Field Visit CRM - Vercel & MongoDB Atlas Deployment Guide

This guide walks you through hosting the entire **Field Visit CRM** (Vite React Frontend + Express.js Backend API) on **Vercel** with a free online **MongoDB Atlas** database.

---

## 🏗️ Architecture Overview

- **Frontend**: Vite + React SPA served as static assets from Vercel's global Edge CDN.
- **Backend API**: Express.js REST API executing as Vercel Serverless Functions via `/api/index.js`.
- **Database**: Online cloud database hosted on MongoDB Atlas (Free Tier M0).
- **Domain**: Single unified domain (e.g., `https://your-app.vercel.app`). All `/api/*` routes are handled seamlessly with **zero CORS issues**.

---

## 📋 Table of Contents

1. [Step 1: Set Up MongoDB Atlas (Online Database)](#step-1-set-up-mongodb-atlas-online-database)
2. [Step 2: Migrate Local Database to MongoDB Atlas](#step-2-migrate-local-database-to-mongodb-atlas)
3. [Step 3: Deploy to Vercel via GitHub](#step-3-deploy-to-vercel-via-github)
4. [Step 4: Configure Environment Variables on Vercel](#step-4-configure-environment-variables-on-vercel)
5. [Step 5: Verify the Live Deployment](#step-5-verify-the-live-deployment)
6. [Troubleshooting & FAQs](#troubleshooting--faqs)

---

## Step 1: Set Up MongoDB Atlas (Online Database)

1. **Sign Up / Log In**:
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.

2. **Create a Free Cluster**:
   - Click **"Create Database"** or **"Build a Database"**.
   - Select **M0 (Free / Shared)** tier (free forever, 512 MB storage).
   - Choose a Cloud Provider & Region closest to your users (e.g., **AWS / Mumbai `ap-south-1`**).
   - Name your cluster (e.g., `Cluster0`) and click **"Create"**.

3. **Create Database Credentials**:
   - In the Quickstart modal (or under **Security > Database Access**):
     - **Authentication Method**: Password
     - **Username**: `crm_admin` (or any username you choose)
     - **Password**: Choose a secure password (avoid special characters like `@`, `:`, `/` or URL-encode them)
     - Click **"Create User"**.

4. **Configure Network Access (Crucial for Vercel)**:
   - In MongoDB Atlas, go to **Security > Network Access** in the left sidebar.
   - Click **"Add IP Address"**.
   - Click **"Allow Access from Anywhere"** (`0.0.0.0/0`).
     > *Why `0.0.0.0/0`?* Vercel uses dynamic serverless IP addresses from cloud providers (AWS/GCP). Restricting to a single IP will cause Vercel serverless connections to time out.
   - Click **"Confirm"**.

5. **Get Your Connection String**:
   - Go to **Database > Clusters** and click **"Connect"**.
   - Select **"Drivers"** (Node.js).
   - Copy the connection string format:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials.
   - Add `/fieldvisitcrm` right before the `?` query parameter:
     ```
     mongodb+srv://crm_admin:your_password@cluster0.xxxxx.mongodb.net/fieldvisitcrm?retryWrites=true&w=majority
     ```

---

## Step 2: Migrate Local Database to MongoDB Atlas

We have included an automated database migration script in this repository: [`backend/scripts/migrateToAtlas.js`](file:///e:/ReactJS/field_visit_crm/backend/scripts/migrateToAtlas.js).

### Run the Migration:
Open PowerShell or your terminal in `e:\ReactJS\field_visit_crm` and run:

```bash
npm run migrate:atlas "mongodb+srv://crm_admin:your_password@cluster0.xxxxx.mongodb.net/fieldvisitcrm?retryWrites=true&w=majority"
```

*(Replace the connection string with your actual Atlas URI).*

### What the Script Does:
1. Connects to your local MongoDB (`mongodb://127.0.0.1:27017/fieldvisitcrm`).
2. Connects to your cloud MongoDB Atlas database.
3. Automatically migrates all collections:
   - `employees` (All employee accounts & roles)
   - `users`
   - `customers`
   - `contactpersons`
   - `opportunities`
   - `quotations`
   - `dailyvisitexpenses`
   - `visits` & `clients`
   - All 10 CRM Masters (Branches, Departments, Designations, Products, Expense Heads, etc.)
4. Uses `upsert` so it can safely be re-run anytime without duplicating data.

---

## Step 3: Deploy to Vercel via GitHub

Because you have already pushed your repository to GitHub:
`https://github.com/testuserid225/Field-Visit-CRM`

1. **Commit and Push the Vercel Configuration**:
   ```bash
   git add .
   git commit -m "Configure Vercel serverless deployment and Atlas migration"
   git push origin main
   ```

2. **Log in to Vercel**:
   - Visit [vercel.com](https://vercel.com) and log in with your GitHub account.

3. **Import Project**:
   - Click **"Add New..."** > **"Project"**.
   - Find and click **"Import"** on `testuserid225/Field-Visit-CRM`.

4. **Build & Output Settings**:
   - **Framework Preset**: `Vite` (Vercel detects this automatically).
   - **Root Directory**: `./` (Default).
   - **Build Command**: `npm run build` (Default).
   - **Output Directory**: `dist` (Default).

---

## Step 4: Configure Environment Variables on Vercel

Before clicking **Deploy**, scroll down to **"Environment Variables"** in the Vercel import screen (or go to **Project Settings > Environment Variables**):

| Key | Recommended Value | Description |
|---|---|---|
| `MONGO_URI` | `mongodb+srv://crm_admin:your_password@cluster0.xxxxx.mongodb.net/fieldvisitcrm?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `field_visit_crm_super_secret_jwt_token_key_2026` | Cryptographic secret for user auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime (7 days) |
| `ENABLE_GOOGLE_AUTH` | `false` | Keeps Google Authenticator disabled for direct login |
| `NODE_ENV` | `production` | Production environment flag |

Click **"Deploy"**!

---

## Step 5: Verify the Live Deployment

Once Vercel finishes building (usually under 1 minute):

1. **Visit Your Vercel URL**:
   - Click on your deployment link (e.g., `https://field-visit-crm.vercel.app`).

2. **Test API Health**:
   - Open `https://your-domain.vercel.app/api/health` in your browser.
   - You should see:
     ```json
     {
       "status": "OK",
       "service": "Field Visit CRM API",
       "database": {
         "status": "Connected"
       }
     }
     ```

3. **Log in**:
   - **Admin**: `EMP-1002` (or `tareqanwar12@gmail.com`) / `tareq@123`
   - **Branch Manager**: `EMP-1003` (or `anwar43131608@gmail.com`) / `tareq@123`
   - **Sales Executive**: `EMP-1001` (or `rahul.sharma@fieldvisitcrm.com`) / `Password@123`
   - **Service Engineer**: `EMP-1004` (or `iqratareq@gmail.com`) / `tareq@123`

---

## 🛠️ Files Created in This Project for Vercel

| File | Purpose |
|---|---|
| [`vercel.json`](file:///e:/ReactJS/field_visit_crm/vercel.json) | Directs `/api/*` to the serverless backend function and all other routes to `index.html` (Vite SPA routing) |
| [`api/index.js`](file:///e:/ReactJS/field_visit_crm/api/index.js) | Serverless function entrypoint that exports the Express app |
| [`backend/app.js`](file:///e:/ReactJS/field_visit_crm/backend/app.js) | Express application decoupled from `app.listen()` for serverless execution |
| [`backend/config/db.js`](file:///e:/ReactJS/field_visit_crm/backend/config/db.js) | Cached database connection pooling optimized for serverless containers |
| [`backend/scripts/migrateToAtlas.js`](file:///e:/ReactJS/field_visit_crm/backend/scripts/migrateToAtlas.js) | One-command CLI migration utility from local MongoDB to MongoDB Atlas |
| [`src/services/api.js`](file:///e:/ReactJS/field_visit_crm/src/services/api.js) | Dynamic API client (`import.meta.env.VITE_API_URL` or relative `/api` on Vercel) |

---

## ❓ Troubleshooting & FAQs

### 1. `MongooseServerSelectionError: connection timed out`
- **Cause**: MongoDB Atlas IP Whitelist does not allow access from Vercel.
- **Fix**: In MongoDB Atlas, go to **Network Access** > **Add IP Address** > choose **Allow Access from Anywhere** (`0.0.0.0/0`).

### 2. `Authentication failed` or `bad auth`
- **Cause**: Incorrect database username or password in `MONGO_URI`.
- **Fix**: Check **Database Access** in Atlas. If your password has special characters like `@` or `#`, change it to letters and numbers or URL-encode special characters (e.g., `@` becomes `%40`).

### 3. Page Refresh shows 404 on Vercel
- **Cause**: Missing SPA rewrite.
- **Fix**: Resolved! `vercel.json` contains `"source": "/(.*)", "destination": "/index.html"` which ensures React Router catches all page refreshes.
