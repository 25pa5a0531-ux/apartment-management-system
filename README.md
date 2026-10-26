# Apartment Visitor and Maintenance Management System

A beginner-friendly full-stack web application designed for residential societies and apartment complexes to manage residents, visitors, maintenance billing, and service complaints.

This application is completely self-contained and **runs independently on Windows** without requiring Google Antigravity or any cloud services.

---

## 🚀 Quick Start (One-Click Launch)

### Starting the Application:
Simply **double-click** the file:
```text
start.bat
```
Located in the project root directory:
```
C:\Users\Admin\.gemini\antigravity\scratch\apartment-management\start.bat
```

What `start.bat` does automatically:
1. Verifies that **Node.js** and **npm** are installed.
2. Generates default `.env` configuration if missing.
3. Automatically installs server and client dependencies if needed.
4. Starts the Express backend on port `5000` in its own window.
5. Starts the React / Vite frontend on port `5173` in its own window.
6. Opens your default web browser directly to **http://localhost:5173**.

---

### Stopping the Application:
Simply **double-click**:
```text
stop.bat
```
This cleanly terminates any processes listening on ports `5000` and `5173`. Alternatively, you can close the two terminal windows that opened during startup.

---

## 💻 Manual Startup (PowerShell / Command Prompt)

If you prefer starting the servers manually from PowerShell:

### Option A: Using PowerShell Scripts
```powershell
# From the project root (apartment-management):
.\start.ps1

# To stop:
.\stop.ps1
```

### Option B: Running in Two Separate Terminals

#### Terminal 1 — Backend:
```powershell
cd apartment-management\server
npm.cmd install        # Only needed the first time
npm.cmd start          # Starts the backend on http://127.0.0.1:5000
```

#### Terminal 2 — Frontend:
```powershell
cd apartment-management\client
npm.cmd install        # Only needed the first time
npm.cmd run dev        # Starts Vite on http://localhost:5173
```

Open your browser at:
👉 **http://localhost:5173**

---

## 🔑 Demo Login Accounts

The system includes pre-configured sample accounts for college mini-project demonstrations. You can also log in instantly using the **Quick One-Click Demo Buttons** on the login page:

| Role | Email | Password | Assigned Flat | Description |
| :--- | :--- | :--- | :--- | :--- |
| **👑 Admin / Manager** | `admin@apartment.com` | `admin123` | Management Desk | Full access to dashboard stats, flat & resident management, billing, and complaint resolutions. |
| **🛡️ Security Guard** | `security@apartment.com` | `security123` | Security Gate | Visitor check-in, checkout, active inside list. Blocked from finance and complaints. |
| **🏠 Resident (Flat 101)** | `john@resident.com` | `resident123` | Flat 101 (Tower A) | Views only Flat 101 visitors, maintenance bills, and submits complaints. |
| **🏠 Resident (Flat 102)** | `priya@resident.com` | `resident123` | Flat 102 (Tower A) | Overdue maintenance bill demonstration. |
| **🏠 Resident (Flat 301)** | `carlos@resident.com` | `resident123` | Flat 301 (Tower B) | Resolved lift complaint demonstration. |

> ⚠️ **Note**: Demo passwords are saved as secure bcrypt hashes. In production deployments, change all default passwords.

---

## 📁 Project Structure

```text
apartment-management/
├── start.bat                    # One-click Windows launcher (Starts backend, frontend, and browser)
├── stop.bat                     # One-click script to stop both servers
├── start.ps1                    # PowerShell launcher script
├── stop.ps1                     # PowerShell stop script
├── package.json                 # Root script runner
├── README.md                    # Project documentation
│
├── client/                      # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI (Sidebar, Navbar, Layout, StatCard, Badge, Modal, Alert, ConfirmDialog)
│   │   ├── context/             # AuthContext (JWT session management)
│   │   ├── pages/               # Pages (Login, Dashboard, FlatsResidents, VisitorRegister, VisitorHistory, MaintenanceBills, Complaints, Profile)
│   │   ├── services/            # Fetch API REST client (api.js)
│   │   ├── styles/              # Pure CSS stylesheet (index.css)
│   │   ├── App.jsx              # Routes & Role-Guard definitions
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js           # Vite config with IPv4 proxy to 127.0.0.1:5000
│
└── server/                      # Backend (Node.js + Express.js)
    ├── controllers/             # Business logic (auth, flats, users, visitors, maintenance, complaints, dashboard)
    ├── database/
    │   ├── db.js                # SQLite connection & schema initialization
    │   └── seed.js              # Idempotent demo database seeder
    ├── middleware/
    │   └── auth.js              # JWT authentication & role-based authorization
    ├── routes/                  # Express REST routes
    ├── data/
    │   └── apartment.db         # Persistent SQLite database file
    ├── app.js                   # Express server entry point
    ├── test-api.js              # Endpoint unit verification script
    ├── test-e2e.js              # Complete 23-assertion E2E workflow test suite
    └── package.json
```

---

## 💾 Database Persistence

- **File Location**: The SQLite database is stored locally inside the project at `server/data/apartment.db`.
- **Automatic Initialization**: On fresh installs, `db.js` creates all required tables and populates sample data if the database is empty.
- **Persistence Across Restarts**: When you restart the application or reboot your computer, existing records (registered visitors, created flats, maintenance bills, and complaint updates) **remain intact and are never wiped**.
- **Optional Manual Reset**: To completely restore original demo sample data at any time, run:
  ```powershell
  cd apartment-management\server
  node database/seed.js
  ```

---

## 🧪 Verified Major Workflows

The application includes an automated end-to-end integration test suite (`node test-e2e.js`) that verifies all 9 user journeys:

1. **Admin logs in and manages flats and residents**:
   - Create new flats (e.g. Flat 501, Tower C, Floor 5) and assign new residents.
2. **Security guard registers a visitor and records checkout**:
   - Check in visitor with name, phone, flat, and vehicle number; records automatic entry timestamp.
   - Click **Exit** to checkout the visitor and record the exit timestamp.
3. **Resident views their visitor history**:
   - Residents can only see visitors logged for their own assigned flat. Data from other flats is blocked.
4. **Admin generates a maintenance bill**:
   - Invoices generated with flat, month, amount, and due date. Status starts as `Pending`.
   - Invoices past due date automatically calculate status as `Overdue`.
5. **Resident views the bill**:
   - Resident views current month invoice and payment status.
6. **Admin records payment**:
   - Admin records offline payment (cash/cheque/bank transfer); status updates to `Paid` with payment timestamp and notes.
7. **Resident submits a complaint**:
   - Resident logs ticket with category (`Plumbing`, `Electrical`, `Cleaning`, `Lift`, `Security`, `Other`) and urgency.
8. **Admin updates complaint status**:
   - Admin transitions status to `In Progress` or `Resolved` and adds manager resolution notes.
9. **Role authorization security**:
   - Security guards are blocked with HTTP 403 Forbidden from accessing maintenance billing or complaints.
   - Residents are blocked from modifying flat or billing records.
   - Unauthenticated requests return HTTP 401 Unauthorized.

---

## 🔧 Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED /api/auth/login` | Backend server is not running on port 5000. | Run `start.bat` or run `npm.cmd start` in `server/`. |
| Port 5000 or 5173 in use | A previous process was left running. | Double-click `stop.bat` to kill lingering processes, then restart with `start.bat`. |
| `npm.ps1 cannot be loaded` | Windows PowerShell Execution Policy restricts `.ps1` scripts. | Use `start.bat` (which runs via CMD) or run commands using `npm.cmd` instead of `npm`. |
| Node.js is not recognized | Node.js is not added to the system PATH. | Install Node.js (v18+) from [nodejs.org](https://nodejs.org/) and restart your terminal. |
