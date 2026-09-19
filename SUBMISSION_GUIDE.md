# 📋 PollPulse — Complete Submission & Deployment Guide

> **GUVI Developer Internship Project Submission Checklist**  
> Send your completed application to: **`devhiring@hclguvi.com`**

---

## 📌 Submission Checklist (3 Items Required)

| Item | Required | Format | Where to Put It |
| :--- | :--- | :--- | :--- |
| **1. Public GitHub Repo** | Mandatory | `https://github.com/<your-user>/live-polling` | Public repository on GitHub |
| **2. Live Deployed URL** | Mandatory | `https://<your-app>.vercel.app` | Publicly accessible URL |
| **3. Video Demonstration** | Mandatory | 3–5 minutes | Unlisted YouTube / Public Google Drive |

---

## 🛠️ Step 1: Push to GitHub

1. Create a new public repository on [GitHub](https://github.com/new) named `live-polling` (or `pollpulse`).
2. Run the following in your terminal:
   ```bash
   cd c:\Users\atchu\hcl-project
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/live-polling.git
   git branch -M main
   git push -u origin main
   ```

---

## ☁️ Step 2: Free 10-Minute Cloud Deployment

The evaluation requires a **publicly deployed URL**. Follow this free, battle-tested blueprint:

### 1. Persistent Database: MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free M0 cluster.
2. Under **Database Access**, create a user (e.g. `polluser` / `securepassword123`).
3. Under **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)**.
4. Click **Connect** -> **Drivers** (Go) -> copy your connection URI:
   ```
   mongodb+srv://polluser:securepassword123@cluster0.mongodb.net/livepolling?retryWrites=true&w=majority
   ```

### 2. Real-Time Engine: Upstash Redis (Free)
1. Go to [upstash.com](https://console.upstash.com/) and create a free Redis database.
2. In the database overview, copy the **Redis URL** (or standard host & port, e.g. `rediss://default:xxxx@warm-cat-12345.upstash.io:6379`).
   *(Standard Redis Cloud at [redis.com/try-free](https://redis.com/try-free/) also works great).*

### 3. Backend Deployment: Render (Free)
1. Go to [render.com](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** -> **Web Service** -> select your `live-polling` repository.
3. Configure the service:
   - **Name**: `pollpulse-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Go`
   - **Build Command**: `go build -o server ./cmd/server`
   - **Start Command**: `./server`
4. Add **Environment Variables**:
   - `PORT`: `10000`
   - `MONGO_URI`: *(Your MongoDB Atlas URI from Step 1)*
   - `DB_NAME`: `livepolling`
   - `REDIS_URL`: *(Your Upstash / Redis Cloud host:port from Step 2)*
   - `JWT_SECRET`: `guvi_super_secret_jwt_prod_key_2026`
   - `FRONTEND_URL`: `https://your-pollpulse-frontend.vercel.app`
5. Click **Deploy Web Service**. Once live, copy your backend URL (e.g. `https://pollpulse-backend.onrender.com`).

### 4. Frontend Deployment: Vercel (Free)
1. Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
2. Click **Add New Project** -> import your `live-polling` repository.
3. Set **Root Directory** to `frontend`.
4. Add **Environment Variable**:
   - `VITE_BACKEND_URL`: `https://pollpulse-backend.onrender.com` *(Your Render backend URL)*
5. Click **Deploy**. Vercel will build and assign you a production URL (e.g. `https://live-polling-delta.vercel.app`).

---

## 🎥 Step 3: Video Demonstration Script (3–5 Minutes)

The review panel strictly requires a **3–5 minute video** explaining the project, architecture, biggest challenge, and AI usage.

### Recommended Recording Outline:

| Timestamp | Section | What to Show on Screen | What to Say / Highlight |
| :--- | :--- | :--- | :--- |
| **0:00–0:30** | **Introduction** | Landing / Login page | "Hi, I'm [Your Name]. This is PollPulse, my GUVI Developer Internship submission—a real-time live polling application where audience votes sync across all spectator screens without any page refreshes using React, Go Gin, MongoDB, Redis Pub/Sub, and WebSockets." |
| **0:30–1:00** | **Authentication & Dashboard** | Login & Dashboard screen | "First, we have secure authentication. Passwords are encrypted with bcrypt, and upon login, the Go backend issues a 7-day JWT token. The creator dashboard displays active polls, total votes, and quick management controls." |
| **1:00–1:40** | **Create Poll** | Poll Creator page | "Creators can add 2 to 10 options, customize expiration, and launch. The backend creates MongoDB audit records and initializes a fast Redis Hash for atomic counts. A unique 6-character share code (e.g. `#66U7A3`) is generated." |
| **1:40–2:10** | **Share Link Setup** | Split screen (Browser A on left, Browser B on right) | "I've arranged two browser windows: the Creator's live results screen on the left, and an incognito window with the public voting link on the right. Note that the left screen displays 'LIVE SYNC ACTIVE'." |
| **2:10–3:00** | **Live Voting (CORE REQUIREMENT)** | Audience voting on right -> watch left update instantly | "Watch closely: I cast a vote for 'Go' on the right window. Instantly, with **zero page refresh**, the creator screen on the left animates the progress bar, increments the total votes, and updates percentages! Attempting to vote again shows an immediate 409 Conflict rejection." |
| **3:00–3:40** | **Architecture Breakdown** | Show Architecture Diagram in README | "Here's the technical data flow: The vote hits Go Gin -> Go checks a Redis Set for voter deduplication -> persists the record to MongoDB -> increments the count using Redis Hash `HINCRBY` -> and publishes a `VOTE_UPDATED` event to Redis Pub/Sub. The Go WebSocket hub receives this event and broadcasts it to all connected browser sockets in that room." |
| **3:40–4:20** | **Biggest Challenge & Solution** | Codebase (`vote_service.go` / `hub.go`) | "The biggest challenge was ensuring race-condition-free counting under heavy concurrency and decoupling WebSockets across server instances. Traditional SQL/Mongo write locks would throttle performance. By leveraging Redis Hashes for atomic in-memory counting and Redis Pub/Sub for event distribution, we achieved sub-millisecond response times." |
| **4:20–5:00** | **AI Usage & Closing** | Summary slide / GitHub repo | "I used AI as an engineering accelerator—specifically to speed up boilerplate Gin routes, CSS variable tokens, and Docker configs. However, all core distributed logic—Redis Hashes, Set deduplication, and WebSocket lifecycle management—was engineered and validated directly. Thank you for your review!" |

---

## ✉️ Step 4: Ready-to-Send Submission Email

Copy and send this email to **`devhiring@hclguvi.com`**:

```text
To: devhiring@hclguvi.com
Subject: GUVI Developer Internship Submission — Live Polling Tool — [Your Full Name]

Dear GUVI Hiring Team,

I have completed the GUVI Developer Internship assignment: the Real-Time Live Polling Application (PollPulse).

Here are my submission details:

1. Public GitHub Repository:
   https://github.com/<your-username>/live-polling

2. Live Deployed Application URL:
   https://<your-project>.vercel.app

3. Video Demonstration (3–5 minutes):
   [Insert Unlisted YouTube Link OR Public Google Drive Link]

Key Architecture Highlights:
- Frontend: React (Vite) with responsive glassmorphism UI and custom reconnecting WebSocket hooks.
- Backend: Go + Gin REST API and Gorilla WebSocket Hub with JWT authentication.
- Persistent Database: MongoDB for user authentication, poll configurations, and immutable vote records.
- Real-Time Engine: Redis directly drives atomic vote counts (HINCRBY), voter deduplication (SADD), and real-time event broadcasting (PUBLISH) to WebSockets with zero page refreshes.
- Containerization: Complete multi-container docker-compose.yml setup included.

Thank you for your review, and I look forward to the technical discussion.

Best regards,
[Your Full Name]
[Your Phone Number]
[Your LinkedIn Profile]
```
