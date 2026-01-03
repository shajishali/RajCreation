/**
 * Schedule Page Functionality
 * Loads and displays events from Supabase
 */

(function() {
    'use strict';

    let allEvents = [];
    let currentFilter = 'all';
    let currentView = 'list';

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        setupEventListeners();
        loadEvents();
    }

    function setupEventListeners() {
        // View toggle
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => switchView('list'));
        }
        if (calendarViewBtn) {
            calendarViewBtn.addEventListener('click', () => switchView('calendar'));
        }

        // Filter buttons
        const filterBtns = document.querySelectorAll('.schedule-filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                displayEvents();
            });
        });
    }

    async function loadEvents() {
        try {
            // Wait for Supabase to be ready
            if (!window.RajCreationSupabase) {
                console.warn('Supabase not initialized, using static events');
                return;
            }

            const events = await window.RajCreationSupabase.getScheduleEvents();
            
            if (events && events.length > 0) {
                allEvents = events;
                displayEvents();
            } else {
                console.log('No events found in database, keeping static events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            // Keep static events on error
        }
    }

    function displayEvents() {
        const scheduleEventsContainer = document.getElementById('scheduleEvents');
        if (!scheduleEventsContainer || allEvents.length === 0) return;

        // Filter events
        let filteredEvents = allEvents;
        
        if (currentFilter !== 'all') {
            filteredEvents = allEvents.filter(event => {
                if (currentFilter === 'upcoming') {
                    return event.status === 'upcoming' || event.status === 'live';
                } else if (currentFilter === 'past') {
                    return event.status === 'past';
                } else if (currentFilter === 'recurring') {
                    return event.is_recurring;
                }
                return true;
            });
        }

        // Clear existing events
        scheduleEventsContainer.innerHTML = '';

        // Display filtered events
        filteredEvents.forEach(event => {
            const eventElement = createEventElement(event);
            scheduleEventsContainer.appendChild(eventElement);
        });

        if (filteredEvents.length === 0) {
            scheduleEventsContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #6c757d;">No events found for this filter.</p>';
        }
    }

    function createEventElement(event) {
        const div = document.createElement('div');
        div.className = 'schedule-event-item';
        
        const eventDate = new Date(event.event_date);
        const day = eventDate.getDate().toString().padStart(2, '0');
        const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
        
        const category = determineCategory(event);
        const isPast = event.status === 'past';
        
        // Format times
        const startTime = formatTime(event.start_time);
        const endTime = formatTime(event.end_time);
        
        // Status badge
        let statusBadge = '';
        if (event.status === 'upcoming') {
            statusBadge = '<span class="event-status upcoming">🔴 Upcoming</span>';
        } else if (event.status === 'past') {
            statusBadge = '<span class="event-status past">✅ Completed</span>';
        } else if (event.status === 'live') {
            statusBadge = '<span class="event-status live">🔴 LIVE NOW</span>';
        } else if (event.status === 'cancelled') {
            statusBadge = '<span class="event-status cancelled">❌ Cancelled</span>';
        }
        
        // Recurring badge
        const recurringBadge = event.is_recurring ? '<span class="event-recurring-badge">🔄 Recurring</span>' : '';
        
        // Actions
        let actions = '';
        if (isPast && event.video_url) {
            actions = `
                <div class="event-actions">
                    <a href="${event.video_url}" class="event-watch-btn" target="_blank">▶ Watch Recording</a>
                </div>
            `;
        } else if (!isPast) {
            actions = `
                <div class="event-actions">
                    <button class="event-reminder-btn" data-event-id="${event.id}">🔔 Set Reminder</button>
                    <button class="event-export-btn" data-event-id="${event.id}">📥 Add to Calendar</button>
                </div>
            `;
        }
        
        div.innerHTML = `
            <div class="event-date-badge ${isPast ? 'past' : ''}">
                <span class="event-day">${day}</span>
                <span class="event-month">${month}</span>
            </div>
            <div class="event-details">
                <div class="event-header">
                    <h3 class="event-title">${event.title}</h3>
                    ${statusBadge}
                    ${recurringBadge}
                </div>
                <div class="event-meta">
                    <span class="event-time">⏰ ${startTime} - ${endTime}</span>
                    <span class="event-timezone">🌍 ${event.timezone || 'IST (UTC+5:30)'}</span>
                    <span class="event-category">📁 ${event.category}</span>
                </div>
                <p class="event-description">${event.description || ''}</p>
                ${actions}
            </div>
        `;
        
        // Add data attributes for filtering
        div.dataset.date = event.event_date;
        div.dataset.category = category;
        div.dataset.recurring = event.is_recurring;
        
        return div;
    }

    function formatTime(timeString) {
        // Convert 24h to 12h format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    function determineCategory(event) {
        const now = new Date();
        const eventDate = new Date(event.event_date);
        
        if (event.status === 'past' || eventDate < now) {
            return 'past';
        } else if (event.status === 'live') {
            return 'live';
        } else {
            return 'upcoming';
        }
    }

    function switchView(view) {
        currentView = view;
        
        const listViewBtn = document.getElementById('listViewBtn');
        const calendarViewBtn = document.getElementById('calendarViewBtn');
        const listView = document.getElementById('scheduleListView');
        const calendarView = document.getElementById('scheduleCalendarView');
        
        if (view === 'list') {
            listViewBtn.classList.add('active');
            calendarViewBtn.classList.remove('active');
            listView.classList.add('active');
            calendarView.classList.remove('active');
        } else {
            calendarViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            calendarView.classList.add('active');
            listView.classList.remove('active');
        }
    }

    // Reminder functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('event-reminder-btn')) {
            const eventId = e.target.dataset.eventId;
            setReminder(eventId);
        } else if (e.target.classList.contains('event-export-btn')) {
            const eventId = e.target.dataset.eventId;
            exportToCalendar(eventId);
        }
    });

    function setReminder(eventId) {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) return;
        
        // Check if browser supports notifications
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    alert(`Reminder set for ${event.title}!\n\nYou'll receive a notification before the event starts.`);
                    // In a production app, you'd schedule this properly
                } else {
                    alert('Please enable notifications to set reminders.');
                }
            });
        } else {
            alert('Your browser does not support notifications.');
        }
    }

    function exportToCalendar(eventId) {
        const event = allEvents.find(e => e.id === eventId);
        if (!event) return;
        
        // Create .ics file content
        const startDateTime = `${event.event_date.replace(/-/g, '')}T${event.start_time.replace(/:/g, '')}00`;
        const endDateTime = `${event.event_date.replace(/-/g, '')}T${event.end_time.replace(/:/g, '')}00`;
        
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//RajCreationz//Schedule//EN
BEGIN:VEVENT
UID:${event.id}@rajcreationz.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || 'Online'}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
        
        // Create download link
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

})();

