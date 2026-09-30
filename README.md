# Real-Time URL Shortener + Analytics Dashboard

An event-driven, production-ready MERN stack URL shortener featuring a Redis cache-aside redirection engine, Socket.io real-time click streaming, and JWT stateless authentication with httpOnly refresh token cookies.

## 🚀 Live Demo & Production Notes
- **Live Frontend Application:** [https://url-shortener-dashboard-ui.onrender.com](https://url-shortener-dashboard-ui.onrender.com)
- **Live Backend API Service:** [https://url-shortener-api-qig8.onrender.com](https://url-shortener-api-qig8.onrender.com)

> ⚠️ **Note on Free-Tier Hosting (Cold Start):** Render free web services spin down after ~15 minutes of inactivity. The initial HTTP request (first load) can take ~1 minute (50–60 seconds) to wake up the cold server container.
> 
> 📊 **Note on Performance Numbers:** The 347 to 770+ req/sec throughput figures in this documentation were measured during controlled LOCAL load tests using `autocannon` under isolated hardware conditions, not under free-tier cloud resource limits. Do not run load tests against the deployed free-tier service.

## 🛠️ Architecture & Core Design Decisions

### 1. Redis Cache-Aside & Write-Through Pipeline
- **Cache-Aside (Lazy Loading):** On redirect (`GET /:shortCode`), Express queries Redis first. On cache hits, it returns an HTTP 302 redirect in sub-milliseconds without querying MongoDB.
- **Cache Pre-Warming (Write-Through):** Upon URL creation (`POST /api/urls`), the backend immediately populates Redis, ensuring 100% cache hits even for brand-new links.
- **Fault-Tolerant Fallback:** If Redis is unreachable or drops connection, the application degrades gracefully by falling back directly to MongoDB.

### 2. Asynchronous Non-Blocking Analytics
- Click logging (`logClickAsync`) is decoupled from the HTTP redirect response path.
- The 302 redirect is returned to the user immediately without `await`ing the MongoDB click insertion or Socket.io event emission.

### 3. Real-Time WebSockets & Room Isolation
- Socket.io connections are authenticated via JWT handshakes.
- Sockets join user-scoped rooms (`user:<userId>`), ensuring live click events stream exclusively to the dashboard of the link owner.

### 4. Stateless Dual-Token Authentication
- **Access Tokens:** Short-lived (15 min) JWTs stored in memory.
- **Refresh Tokens:** Long-lived (7 days) JWTs stored in `httpOnly`, `SameSite=None`, `Secure` cookies with automatic silent renewal via Axios interceptors.

## 🧪 Local Load Test Results (`autocannon` - 50 connections, 30s)

| Metric | Direct MongoDB (Uncached) | Redis Cache-Aside (Cached) | Performance Improvement |
| :--- | :---: | :---: | :--- |
| **Total Requests** | 10,419 | **23,096** | **+122% total volume** |
| **Avg Throughput** | 347 req/sec | **770 req/sec** | **2.2x throughput multiplier** |
| **Median Latency (p50)** | 131 ms | **59 ms** | **55% latency reduction** |
| **Tail Latency (p99)** | 332 ms | **120 ms** | **64% tail latency compression** |
