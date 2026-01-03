# 🚀 Quick Fix Guide - Network Error

## The Problem
You're getting: `TypeError: NetworkError when attempting to fetch resource`

This means the **settings table doesn't exist** in your Supabase database.

---

## ✅ Solution (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: **raj-creations** (or whatever you named it)

### Step 2: Open SQL Editor
1. Look for **"SQL Editor"** in the left sidebar
2. Click on it
3. You'll see a text editor where you can run SQL commands

### Step 3: Run the Setup Script
1. In your current folder, you have a file: `supabase-complete-setup.sql`
2. Open it and **copy ALL the contents** (Ctrl+A, then Ctrl+C)
3. Go back to Supabase SQL Editor
4. **Paste** the SQL code (Ctrl+V)
5. Click the **"Run"** button (or press F5)
6. Wait for it to complete (should take 5-10 seconds)

### Step 4: Verify Tables Were Created
After running the script, you should see a success message.

To verify:
1. Click **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ `settings`
   - ✅ `thumbnails`
   - ✅ `videos`
   - ✅ `photos`

### Step 5: Test Again
1. Go back to your browser with the test page open
2. Click **"Test Connection"** button again
3. It should now show: ✅ **Success!**

---

## 🎯 What the SQL Script Does

The `supabase-complete-setup.sql` script:
- ✅ Creates all necessary tables (`settings`, `thumbnails`, `videos`, `photos`)
- ✅ Sets up Row Level Security (RLS) policies for public access
- ✅ Creates indexes for better performance
- ✅ Sets up triggers for automatic timestamp updates
- ✅ Adds default data

---

## 📸 Need to Store Images Too?

If you also want to store thumbnail images in Supabase Storage:

1. In Supabase Dashboard, click **"Storage"** in the left sidebar
2. Click **"New bucket"**
3. Name it: `images`
4. Toggle **"Public bucket"** to ON
5. Click **"Create bucket"**

---

## 🔍 Still Having Issues?

If you still get errors after running the SQL script:

### Check Your Supabase Config
Open `js/config.js` and verify:
```javascript
supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',  // Should match your project
    anonKey: 'eyJ...'  // Should be your anon/public key
}
```

### Get the Correct Values
1. In Supabase Dashboard, click **"Settings"** (gear icon)
2. Click **"API"**
3. Copy:
   - **Project URL** → use for `url`
   - **anon/public key** → use for `anonKey`

---

## 🎉 After Fix

Once the setup is complete:
1. Refresh the test page
2. All tests should pass ✅
3. Go to your admin panel: `http://localhost:8000/admin/index.html`
4. Try uploading a thumbnail or saving embed code
5. It should work! 🚀

---

## Need Help?

If you're still stuck, let me know which step is failing and I'll help debug it!

