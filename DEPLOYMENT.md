# Deployment Guide

BookEvent is a MERN app deployed as two pieces:

- **Frontend** (Vite + React) → **Vercel**
- **Backend** (Express + MongoDB) → **Render** (Express servers don't fit
  Vercel's serverless model well)

Deploy the **backend first** so you have its URL for the frontend.

---

## 1. MongoDB Atlas

- In **Network Access**, allow `0.0.0.0/0` (cloud hosts use changing IPs).
- Have your connection string ready (the `MONGO_URI`).

---

## 2. Backend → Render

1. Push this repo to GitHub (done).
2. Go to [render.com](https://render.com) → **New → Web Service** (or **New →
   Blueprint** to use the included `render.yaml`).
3. Settings (if not using the blueprint):
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Add the environment variables (see table below) and deploy.
5. Copy the service URL, e.g. `https://bookevent-api.onrender.com`.

### Seed the production database (once)
From your machine, point the seed script at the production DB:

```bash
cd backend
# temporarily set MONGO_URI to your Atlas string, then:
npm run seed
```

(Your events may already exist from earlier — seeding just resets them.)

### Backend environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `MONGO_URI` | ✅ | Your MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | A long random string (token signing) |
| `EMAIL_USER` | for email | Your Gmail address |
| `EMAIL_PASS` | for email | Gmail **App Password** (16 chars, no spaces) |
| `CLIENT_URL` | optional | Your Vercel URL, to lock CORS (e.g. `https://bookevent.vercel.app`) |
| `PORT` | ❌ | Render sets this automatically — do not add it |

> Email alternative: instead of `EMAIL_USER`/`EMAIL_PASS`, set `RESEND_API_KEY`
> (and `EMAIL_FROM`) to send via Resend. Leave all blank to use the Ethereal
> test inbox (not useful in production).

---

## 3. Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import this repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (auto-detected). Build/output are automatic.
3. Add the environment variable below, then deploy.

### Frontend environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `VITE_API_URL` | ✅ | Your Render backend URL **+ `/api`**, e.g. `https://bookevent-api.onrender.com/api` |

> `VITE_*` vars are baked in at **build time**. If you change the backend URL
> later, redeploy the frontend.

---

## 4. Final wiring

- (Optional) Set `CLIENT_URL` on Render to your Vercel URL and redeploy the
  backend, so CORS is restricted to your frontend.
- Open the Vercel URL, register, verify via the emailed code, and book a seat.

### Note on Render's free tier
Free services sleep after ~15 min idle, so the **first request after idle can
take ~30–50s** while it wakes up. Subsequent requests are fast.
