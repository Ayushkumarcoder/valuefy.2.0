# Wealth Builder 2025 - Portfolio Rebalancing
A full-stack web application built for a live coding interview. Demonstrates clean architecture, raw SQL queries, and a custom rebalancing algorithm.

## 🚀 How to Run in 3 Commands

Open a terminal in this root directory (`valuefy.2.0`) and run:

```bash
# 1. Install dependencies for both folders
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Start the backend Server (Port 3001)
cd backend && npm run dev

# 3. Open a NEW terminal tab and start the React app (Port 5173)
cd frontend && npm run dev
```

App runs at: **[http://localhost:5173](http://localhost:5173)**

---

## 🏗 Data Flow Diagram

```ascii
 🖥️ FRONTEND (React)                           🛠️ BACKEND (Express)                 🗄️ DATABASE (SQLite)
 
 [App.jsx]                                   [server.js]                          [model_portfolio.db]
    │  (Dropdown: Amit Sharma)                    │                                          │
    ▼                                             ▼                                          ▼
 [RebalancingDashboard] ── GET /api/rebalance ─► [routes/rebalance.js] ── read ────► [clients, model_funds,
    │                                             │  (calculateRebalancing.js)        client_holdings]
    ▼                                             │                                          
 [Display Drift Table]                            │  ◄── return Math logic
    │                                             │
    ▼                                             ▼                                          ▼
 [Save Recommendation] ── POST /api/save ──────► [routes/rebalance.js] ── insert ──► [rebalance_sessions, 
                                                                                      rebalance_items]
```

## 🧠 The Rebalancing Math (calculateRebalancing.js)
1. Fetch `client_holdings`, sum all current values to get **total portfolio value**.
2. Loop through `model_funds` (target portfolio).
3. Compute `current_pct` vs `target_pct` to get the **drift**.
4. Multiply drift by total value to get exact rupee amount. Positive = **BUY**, Negative = **SELL**.
5. Any holding NOT in the model portfolio is automatically flagged as **REVIEW**.
