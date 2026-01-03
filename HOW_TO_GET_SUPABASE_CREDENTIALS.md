# 📍 How to Get Your Supabase URL and API Key

## Step-by-Step Instructions:

### 1. Go to Supabase Dashboard
Open your browser and go to:
```
https://supabase.com/dashboard
```

### 2. Sign In
- Log in with your account

### 3. Select Your Project
- You'll see a list of your projects
- Click on your project (looks like it's named something with "ahxqgrdiyfjsmjrkibdg")

### 4. Get Your Credentials
Once inside your project:

**Method 1 - Settings Page (Recommended):**
1. Click the **⚙️ Settings** icon (at the bottom of the left sidebar)
2. Click **"API"** in the settings menu
3. You'll see a page with:

   📋 **Project URL:**
   ```
   https://ahxqgrdiyfjsmjrkibdg.supabase.co
   ```
   
   📋 **API Keys:**
   - ✅ `anon` / `public` key - **USE THIS ONE**
   - ❌ `service_role` key - **DON'T USE** (this is for server-side only)

**Method 2 - Home Page:**
1. Click **"Home"** in the left sidebar
2. Scroll down to **"Project API keys"**
3. Copy the values from there

---

## 🎯 What You Need:

Based on your anon key, your correct values are:

### ✅ Supabase URL:
```
https://ahxqgrdiyfjsmjrkibdg.supabase.co
```

### ✅ Anon Key (already correct):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoeHFncmRpeWZuc21qcmtpYmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDQ4MjksImV4cCI6MjA4MjkyMDgyOX0.dHS0r8_m4yOcGoItWZzpZie2H9Lt-edi4zPnlDd72VI
```

**Good news:** I already updated these in your `js/config.js` file! ✅

---

## 🔍 Visual Guide:

```
Supabase Dashboard
│
├── [Select Your Project]
│   │
│   └── ⚙️ Settings (bottom left sidebar)
│       │
│       └── API
│           ├── 📋 Project URL ← COPY THIS
│           ├── 📋 anon/public key ← COPY THIS
│           └── ❌ service_role key (don't use)
```

---

## ✅ Current Status:

Your configuration is **already fixed**! The URL now matches your anon key:

- URL: `https://ahxqgrdiyfjsmjrkibdg.supabase.co` ✅
- Key: `eyJhbGci...` ✅

---

## 🚀 Next Steps:

1. **Refresh your browser** (F5)
2. Test connection: `http://localhost:8000/diagnose-supabase.html`
3. If it says "Settings table doesn't exist", run the SQL setup script
4. Done! 🎉

---

## 💡 Pro Tip:

You can always find these values at:
**Supabase Dashboard → Your Project → Settings → API**

The URL format is always:
```
https://YOUR-PROJECT-REF.supabase.co
```

Where `YOUR-PROJECT-REF` is a unique identifier (in your case: `ahxqgrdiyfjsmjrkibdg`)

