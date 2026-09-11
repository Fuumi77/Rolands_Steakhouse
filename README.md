# Roland's Steakhouse — Digital Dining & Kitchen Management System

> A fine dining management system featuring online table reservations, priority food pre-ordering, real-time Kitchen Display System (KDS), POS terminal, customer self-cancellation with automated inventory restoration, and an executive Super Admin dashboard.

---

## 🥩 Overview

**Roland's Steakhouse** is a digital restaurant operations platform designed to streamline operations from customer table booking through kitchen prep and billing. Built with a unified Luxury Steakhouse Design System (Deep Emerald, Charcoal, and Champagne Gold), it is fully responsive across mobile phones (320px+), tablets, and desktop displays.

---

## ✨ Key Features

### 1. Customer Dining Portal (`index.html`)
* **Hero Slideshow & Heritage**: Visual storytelling showcasing Roland's history in General Santos City since 1994.
* **Interactive Menu Book**: Touch-gesture and click-enabled flipbook menu.
* **Reservation Engine**: Real-time operating hours limiter (10:30 AM to 9:00 PM), holiday detection, and automated cutoff safeguards.
* **Unified Guest Portal (`🟢 My Booking`)**: In-modal lookup, receipt viewing, and customer self-cancellation with live kitchen queue badges.

### 2. Table & Seat Selection (`seat-selection.html`)
* **Live Floor Plan**: Tables 1–10 and VIP private dining rooms.
* **Conflict Prevention**: Automatically flags occupied tables and blocks conflicting reservations within 2.5 hours.
* **Dual Booking Modes**: Standard Table Reservation vs. Priority Reservation (with advance food pre-ordering).

### 3. Priority Food Pre-Order (`pre-order.html`)
* **Custom Meat Doneness**: Rare, Medium Rare, Medium, and Well Done with custom chef notes.
* **Live Inventory Sync**: Prevents ordering out-of-stock dishes and synchronizes portions via `inventory-system.js`.
* **Mobile Sheet Cart**: Responsive bottom-sheet cart drawer with real-time bill calculations and kitchen notes.

### 4. Kitchen Display System (KDS) (`kitchen.html`)
* **Security Gate**: Protected by 4-digit cook access PIN.
* **Kanban Workflow**: Drag-free, one-tap ticket management:
  * `PENDING ORDERS` → `NOW COOKING` → `READY TO SERVE` → `SERVED / DISMISS`.
* **Live Timers & Alerts**: Automatic elapsed minute badges (`Recent`, `Urgent`) with audio chime notifications for new incoming orders.

### 5. Point-of-Sale (POS) Terminal (`pos.html`)
* **Cashier Terminal**: Quick walk-in billing, table assignments, and bill calculation.
* **Real-time Inventory Tracking**: Direct stock deduction on completed sales.

### 6. Super Admin & Staff Dashboards (`superadmin.html` & `admin.html`)
* **Executive Metrics**: Total Reservations, Priority %, Revenue calculation, registered staff, and live browsing customers.
* **Analytics**: Dynamic Chart.js booking activity curves and reservation breakdown donut charts.
* **Master Store Control**: Emergency toggle to instantly open or close restaurant online booking with banner notifications.
* **Floor Plan & Table Release**: One-click staff cancellation with automated inventory restocking.

---

## 🛠️ Technology Stack

* **Frontend**: Vanilla HTML5, CSS3 Design System (Custom CSS variables, Glassmorphism, Zero framework bloat), JavaScript (ES6+).
* **Backend**: Node.js, Express.js.
* **Real-time Synchronization**: Web `BroadcastChannel` API, `localStorage`, and HTTP streaming.
* **Integrations**: PayMongo (Payment Gateway), Supabase (Cloud PostgreSQL ready), Nodemailer (E-Receipts).

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org) (v16 or higher recommended)
* Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/Rolands-Steakhouse.git
   cd Rolands-Steakhouse
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Optional: fill in your PayMongo or Supabase credentials if using cloud features).*

4. **Start the server**:
   * **Windows Quick-Start**: Double-click `START SERVER.bat`.
   * **Terminal**:
     ```bash
     npm start
     ```

5. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 🔑 Default Access Credentials

| System Area | Route | Default Access Key / PIN | Notes |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/superadmin.html` | `rolands1994` | Master management passkey |
| **Kitchen (Cook)**| `/kitchen.html` | `1234` | 4-digit numpad PIN |
| **POS Terminal** | `/pos.html` | `0000` | Cashier terminal PIN |
| **Staff Login** | `/login.html` | Click logo 7 times | Quick staff backdoor shortcut |

---

## 📁 Project Structure

```text
├── css/                     # Unified Design System & responsive stylesheets
│   ├── design-system.css    # Color tokens, typography, luxury buttons, badges
│   ├── responsive.css       # Mobile/Tablet breakpoints (320px to 1024px)
│   ├── style.css            # Homepage styles
│   ├── kitchen.css          # KDS dark-mode kanban styling
│   └── superadmin.css       # Super Admin dashboard layouts
├── js/                      # Core business logic
│   ├── design-system.js     # Modal utilities and toast engines
│   └── inventory-system.js  # Live ingredient BOM validation & restock engine
├── images/                  # High-resolution optimized restaurant assets
├── index.html               # Customer landing page & Guest Portal
├── seat-selection.html      # Interactive table reservation floor plan
├── pre-order.html           # Food ordering catalog & cart
├── payment.html             # Payment submission & transaction proof
├── kitchen.html             # Kitchen Display System (KDS)
├── pos.html                 # Point-of-Sale terminal
├── admin.html               # Staff Admin dashboard
├── superadmin.html          # Executive Super Admin dashboard
├── server.js                # Express backend & API gateway
├── START SERVER.bat         # Automated 1-click Windows startup script
├── .env.example             # Safe environment variable template
└── package.json             # Node dependencies and npm scripts
```

---

## 📄 License
This project was developed for Capstone Presentation. All rights reserved.
