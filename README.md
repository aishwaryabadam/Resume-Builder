# ✨ Resume Builder — AI-Powered (React + Gemini)



A clean, modern Resume Builder application that uses **React (Vite)** for the frontend and the **Gemini** generative API for AI-powered cover letters, resume optimization, and ATS analysis. This README explains the tech stack, how to run the project locally, secure API usage, and deployment guidance — written to be simple, practical and aesthetic.

---

## 🔧 Tech Stack

* **Frontend:** React (Vite)
* **Styling:** Plain CSS + glassmorphism styles (in-component and `Home.css`)
* **AI:** Google Generative Language (Gemini) — accessed via a secure backend proxy
* **Backend (recommended):** Node.js + Express (simple proxy to hide API key)
* **Tooling:** npm, Vite dev server

---

## 🌱 Quick overview

* The app collects: `Company Name`, `Experience Level`, `Job Description`, and optional `Current Resume`.
* Frontend sends a *prompt* to the backend which calls Gemini with a secret API key.
* Response is parsed and displayed in styled sections: **Cover Letter**, **Updated Resume**, **Keyword Match**, **ATS Score**.

---

## 🔐 Environment & Security (VERY IMPORTANT)

* Keep **all secret keys** on the **backend**. **Never** put your real Gemini API key in frontend code.
* Frontend Vite env variables must be prefixed with `VITE_` (only for non-secret configuration like base URL). Example:

```
# frontend .env (project root)
VITE_API_BASE_URL=http://localhost:5000
```

* Backend `.env` (NOT committed) example:

```
# backend .env
PORT=5000
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
ALLOWED_ORIGINS=http://localhost:5173
```

> Make sure `.env` files are included in `.gitignore` (you already have `.env` in `.gitignore`).

---

## 🚀 How to run (Local Development)

### 1) Clone your repo (if not already local)

```bash
git clone https://github.com/YOUR_USERNAME/Resume-Builder.git
cd Resume-Builder
```

### 2) Frontend: Install & start (Vite)

```bash
cd demo        # or the folder with package.json
npm install
# create .env with: VITE_API_BASE_URL=http://localhost:5000 (optional)
npm run dev
```

Open `http://localhost:5173` (or the URL Vite prints).

**If `import.meta.env.VITE_API_BASE_URL` or other VITE_ vars are `undefined`**:

1. Ensure `.env` is in the project root (same folder as `package.json`).
2. Prefix variables with `VITE_`.
3. Restart the dev server after changing `.env`.

---

### 3) Backend (recommended) — quick Express proxy

> Place the backend in a sibling folder (or separate repo). The backend *holds* `GEMINI_API_KEY` in its `.env`.

**server.js** (minimal example):

```js
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors({ origin: (o, cb) => cb(null, true) }));
app.use(express.json());

app.post('/api/gemini', async (req, res) => {
  const { prompt } = req.body;
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const text = await response.text();
  res.status(response.status).send(text);
});

app.listen(process.env.PORT || 5000, () => console.log('Backend running'));
```

Start backend:

```bash
npm install
node server.js
# or use nodemon for dev: npx nodemon server.js
```

---

## 🔁 How the frontend should call the backend

```js
// client-side example
const resp = await fetch(import.meta.env.VITE_API_BASE_URL + '/api/gemini', {
  method: 'POST',
  headers: { 'Content-Type':'application/json' },
  body: JSON.stringify({ prompt })
});

const data = await resp.json();
// data may need parsing depending on backend
```

---

## 🧩 Parsing & UI

* The frontend includes a custom parser that splits Gemini's response into numbered sections and formats lists and bold text.
* The UI uses glassmorphism cards, gradients, and micro-animations for a polished feel. You can find styles in `src/pages/Home.jsx` and `src/pages/Home.css`.

---

## 🛠️ Debugging tips

* **`import.meta.env.VITE_GEMINI_API_KEY` is undefined** → ensure `.env` at root and restart Vite.
* If Google returns **400/403** or **CORS errors**, use the backend proxy. Browser requests to Google generative endpoints are often blocked.
* Log raw response for diagnosis (in `handleGenerateData`):

```js
const raw = await resp.text();
console.log('HTTP', resp.status, raw);
```

* Use safe access when reading result: `const text = data?.candidates?.[0]?.content?.parts?.[0]?.text`.

---

## 📦 Build & Deploy

### Build frontend (Vite):

```bash
npm run build
# outputs dist/
```

### Deploy frontend

* **Vercel** or **Netlify** are excellent for Vite apps. Connect GitHub repo, set build command `npm run build`, and publish directory `dist`.
* Make sure `VITE_API_BASE_URL` in the deployed environment points to your backend URL.

### Deploy backend

* Use **Render**, **Railway**, **Heroku**, or **Vercel functions**.
* Add `GEMINI_API_KEY` as an environment variable in the hosting dashboard (do not commit it to Git).

---

## 📖 Troubleshooting checklist (one-liner fixes)

* `.env` undefined → put `.env` in project root, restart dev server
* `400` from Gemini → inspect raw body, use backend, check API key
* `TypeError reading 0` → guard with optional chaining when reading `candidates`

---

## 🙌 Final notes & best practices

* Always protect API keys behind a backend.
* Add rate limiting to the backend to protect against misuse.
* Monitor usage & billing in Google Cloud.
* Remove console logging of keys before committing or deploying.

