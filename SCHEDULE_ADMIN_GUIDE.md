# 📅 Schedule Admin Setup Guide

## Step 1: Setup Supabase Database

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Open your project**: `RajCreation` (ahxqgrdiyfnsmjrkibdg)
3. **Click "SQL Editor"** in the left sidebar
4. **Click "New Query"**
5. **Copy ALL the contents** from `supabase-schedule-setup.sql`
6. **Paste into the SQL Editor**
7. **Click "Run"** or press Ctrl+Enter

You should see:
```
✅ Setup completed successfully!
✅ Total events: 4
```

## Step 2: Access the Admin Panel

1. Open: `admin/schedule.html` in your browser
2. Or visit: https://www.rajcreationz.com/admin/schedule.html

## Step 3: Manage Events

### Add New Event:
1. Click **"➕ Add New Event"** button
2. Fill in event details:
   - **Title**: Event name (required)
   - **Description**: Brief description
   - **Date**: Event date (required)
   - **Start Time & End Time**: Event duration (required)
   - **Category**: Type of event
   - **Status**: upcoming/live/past/cancelled
   - **Recurring**: Check if repeats
   - **Video URL**: For past events with recordings

3. Click **"Save Event"**

### Edit Event:
1. Click **"✏️ Edit"** button on any event
2. Modify the details
3. Click **"Save Event"**

### Delete Event:
1. Click **"🗑️ Delete"** button
2. Confirm deletion

## Features

### Admin Panel (`admin/schedule.html`):
- ✅ Add, Edit, Delete events
- ✅ Set event status (upcoming, live, past, cancelled)
- ✅ Mark events as recurring
- ✅ Add video URLs for past events
- ✅ Beautiful, modern UI
- ✅ Real-time updates from Supabase

### Public Schedule Page (`schedule.html`):
- ✅ Displays all events from Supabase
- ✅ Filter by: All, Upcoming, Past, Recurring
- ✅ List view and Calendar view
- ✅ Set reminders for upcoming events
- ✅ Export events to calendar (.ics files)
- ✅ Watch recordings for past events

## Event Statuses

- **🔴 Upcoming**: Future events
- **🔴 LIVE NOW**: Currently happening
- **✅ Completed**: Past events
- **❌ Cancelled**: Cancelled events

## Event Categories

- Regular Show
- Special Event
- Discussion
- Workshop
- Live Performance
- Other

## Recurring Events

Check the "Recurring Event" checkbox and select:
- **Daily**: Repeats every day
- **Weekly**: Repeats every week
- **Monthly**: Repeats every month

## Troubleshooting

### "Network error" when saving:
1. Check Supabase URL and API key in `js/config.js`
2. Make sure you ran `supabase-schedule-setup.sql`
3. Check your internet connection

### "Table not found":
Run `supabase-schedule-setup.sql` in Supabase SQL Editor

### Events not showing:
1. Check browser console for errors
2. Verify Supabase connection
3. Make sure events exist in the database

## Database Structure

The `schedule_events` table stores:
- `id`: Unique identifier
- `title`: Event name
- `description`: Event description
- `event_date`: Date of event
- `start_time`: Start time
- `end_time`: End time
- `timezone`: Time zone (default: IST)
- `category`: Event category
- `status`: Event status
- `is_recurring`: Whether event repeats
- `recurring_pattern`: How often it repeats
- `location`: Event location (optional)
- `video_url`: Recording URL (optional)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Next Steps

1. ✅ Run the SQL setup script
2. ✅ Access the admin panel
3. ✅ Add your first event
4. ✅ View it on the public schedule page
5. ✅ Share the schedule page with your audience!

---

**Need help?** Check the browser console (F12) for error messages.

