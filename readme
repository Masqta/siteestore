# 🎧 AirStore Bulgaria - GitHub File Storage Setup

This version saves all data (orders, reviews) as JSON files directly in your GitHub repository!

---

## 📁 How It Works

| Data Type | Storage Location |
|-----------|-----------------|
| **Orders** | `data/orders/order-{timestamp}.json` |
| **Reviews** | `data/reviews/review-{timestamp}.json` |

Each order/review is saved as a separate JSON file in your GitHub repo!

---

## 🚀 Setup Instructions

### **Step 1: Create GitHub Personal Access Token**

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Give it a name like "AirStore"
4. Select these permissions:
   - ✅ `repo` (Full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you can't see it again!)

---

### **Step 2: Add Token to Netlify**

1. Go to **Netlify Dashboard** → Your Site → **Site Settings**
2. Click **"Environment variables"**
3. Click **"Add variable"**
4. Add these variables:

| Key | Value |
|-----|-------|
| `GITHUB_TOKEN` | Your token from Step 1 |
| `GITHUB_REPO` | `Masqta/airpods` (your repo) |
| `GITHUB_BRANCH` | `main` |

---

### **Step 3: Create Data Folders**

In your GitHub repository, create these folders:

```
data/
├── orders/     ← Orders will be saved here
└── reviews/    ← Reviews will be saved here
```

You can create them by:
1. Going to your repo on GitHub
2. Click **"Add file"** → **"Create new file"**
3. Type `data/orders/.gitkeep` (this creates the folder)
4. Type `data/reviews/.gitkeep` (this creates the folder)

---

### **Step 4: Deploy**

Push your changes to GitHub and Netlify will auto-deploy!

---

## 📂 File Structure in Your Repo

After orders come in, your repo will look like:

```
airpods/
├── index.html
├── admin-094312/
│   └── index.html
├── assets/
│   └── ... your images
├── data/
│   ├── orders/
│   │   ├── order-1712345678901.json
│   │   ├── order-1712345689012.json
│   │   └── ...
│   └── reviews/
│       ├── review-1712345678901.json
│       └── ...
└── netlify/functions/
    └── ... (9 functions)
```

---

## 📝 Example Order File

Each order is saved as a JSON file like this:

```json
{
  "id": 1712345678901,
  "date": "2024-03-29T20:34:38.901Z",
  "name": "Иван Петров",
  "phone": "0878460279",
  "city": "София",
  "courier": "Econt",
  "deliveryType": "office",
  "address": "Офис Младост 1",
  "qty": 2,
  "totalEur": "90.00",
  "totalBgn": "176",
  "promoCode": "SAVE10",
  "status": "new"
}
```

---

## 📝 Example Review File

Each review is saved as a JSON file like this:

```json
{
  "id": 1712345678901,
  "name": "Мария К.",
  "rating": 5,
  "text": "Много съм доволна от продукта!",
  "verified": true,
  "createdAt": "2024-03-29T20:34:38.901Z"
}
```

---

## ✅ Advantages of GitHub Storage

| Feature | Benefit |
|---------|---------|
| **Free** | No database costs |
| **Version Control** | See all changes in Git history |
| **Backup** | GitHub backs up your data |
| **Easy Export** | Download all data anytime |
| **No Limits** | Unlimited files (within GitHub limits) |

---

## ⚠️ Limitations

| Limitation | Details |
|------------|---------|
| **Rate Limits** | GitHub API has limits (5000 requests/hour) |
| **File Size** | Max 100MB per file |
| **Repo Size** | Max 1GB recommended |
| **Concurrent Writes** | May have conflicts if many orders at same time |

---

## 🔧 Troubleshooting

### "GITHUB_TOKEN not set" error
- Make sure you added the environment variable in Netlify
- Redeploy after adding variables

### "Failed to save" error
- Check your token has `repo` permission
- Verify `GITHUB_REPO` is correct (format: `username/repo`)

### Orders not showing
- Check the `data/orders/` folder exists in your repo
- Check Netlify Functions logs in dashboard

---

## 🎁 Promo Codes (same as before)

```
A1B2C3, X7Y8Z9, P5Q6R7, M3N4O5, D8E9F0, SAVE10, AIR10, PROMO1
```

---

## 📊 Admin Panel

**URL:** `your-site.com/admin-094312/`

**Login:**
- Username: `vankoadmin`
- Password: `vanko094312`

Now shows real data from your GitHub repository!

---

**Your data is now saved in your GitHub repo! 🎉**
