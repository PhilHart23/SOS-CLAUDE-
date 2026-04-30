# VerifyBase Backend

A lightweight Express server that proxies Apify API calls for the VerifyBase SOS/KYB lookup tool.
Your Apify token lives securely on the server — never in the browser.

---

## Deploy to Render (Free) — Step by Step

### Step 1 — Put this code on GitHub

1. Go to **github.com** → click **"New repository"**
2. Name it `verifybase-backend`, set it to **Private**, click **Create**
3. On your computer, open a terminal and run:

```bash
git init
git add .
git commit -m "Initial backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/verifybase-backend.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your GitHub username.

---

### Step 2 — Deploy on Render

1. Go to **render.com** → Sign up free (use your GitHub account)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"** → select `verifybase-backend`
4. Fill in the settings:
   - **Name:** `verifybase-backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Click **"Add Environment Variable"**:
   - Key: `APIFY_TOKEN`
   - Value: *(paste your Apify token here)*
6. Click **"Create Web Service"**

Render will build and deploy in ~2 minutes.

---

### Step 3 — Get your backend URL

Once deployed, Render gives you a URL like:
```
https://verifybase-backend.onrender.com
```

Copy that URL — you'll paste it into the VerifyBase frontend app.

---

## API Endpoints

### `GET /`
Health check. Returns `{ status: "ok" }`.

### `POST /search`
Run a business entity lookup.

**Request body:**
```json
{
  "searchTerm": "Acme Corporation",
  "states": ["TX", "DE"]
}
```

**Response:**
```json
{
  "results": [
    {
      "business_name": "ACME CORPORATION",
      "status": "Active",
      "entity_type": "Domestic Corporation",
      "state": "TX",
      ...
    }
  ]
}
```

Leave `states` as `[]` to search all supported states.

---

## Local Development

```bash
npm install
APIFY_TOKEN=apify_api_xxx node server.js
```

Server runs on http://localhost:3001
