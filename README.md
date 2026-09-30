# Real-Time URL Shortener + Analytics Dashboard

An event-driven, production-ready MERN stack URL shortener with a Redis cache-aside redirection engine, Socket.io real-time click streaming, and JWT stateless authentication.

## 🚀 Live Demo & Deployment Notes
- **Live Frontend:** `https://<your-frontend-name>.onrender.com`
- **Live Backend API:** `https://<your-backend-name>.onrender.com`

> **Note on Free-Tier Hosting:** Render free web services spin down after ~15 minutes of inactivity. The initial HTTP request may take ~50–60 seconds to wake up the cold container.
> **Note on Performance Metrics:** The 347 to 770+ req/sec throughput figures in this documentation were measured during controlled local load testing using `autocannon` under isolated conditions, not under free-tier cloud resource constraints.

## 🛠️ Architecture & Core Design Decisions

### 1. Redis Cache-Aside & Pre-Warming Pipeline
- **Cache-Aside (Lazy Loading):** On redirect (`GET /:shortCode`), Express queries Redis first. On cache hits, it returns an HTTP 302 redirect in sub-milliseconds without querying MongoDB.
- **Cache Pre-Warming (Write-Through):** Upon URL creation (`POST /api/urls`), the backend immediately populates Redis, ensuring 100% cache hits even for brand-new links.
- **Graceful Fallback:** If Redis is unreachable, the application degrades gracefully by querying MongoDB directly.

### 2. Asynchronous Non-Blocking Analytics
- Click logging (`logClickAsync`) is intentionally decoupled from the redirect HTTP response path.
- The 302 redirect is returned to the user immediately without `await`ing the click database insertion or Socket.io event emission.

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

## ⚙️ Environment Variables

### Backend (`.env`)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/url_shortener
REDIS_URL=redis://<user>:<password>@host:port
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=https://<your-frontend-name>.onrender.com
BASE_URL=https://<your-backend-name>.onrender.com
```

### Frontend (`client/.env`)
```env
VITE_API_URL=https://<your-backend-name>.onrender.com
```
