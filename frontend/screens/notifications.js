// frontend/screens/notifications.js

// --- 1. TOAST SYSTEM ---

function showToast(message, linkUrl = null, linkText = 'Open', duration = 3000) {
    // A. Show the Visual Popup
    const toast = document.createElement('div');
    toast.className = 'toast-notification';

    let content = `<span class="toast-msg">${message}</span>`;
    if (linkUrl) content += `<a href="${linkUrl}" target="_blank" class="toast-btn">${linkText}</a>`;

    toast.innerHTML = content;
    document.body.appendChild(toast);

    saveToHistory(message);

    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function showConfirm(message, onConfirm) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <span class="toast-msg">${message}</span>
        <div class="toast-actions">
            <button class="toast-btn-cancel">Cancel</button>
            <button class="toast-btn-confirm">Yes</button>
        </div>
    `;
    document.body.appendChild(toast);

    toast.querySelector('.toast-btn-confirm').onclick = () => { onConfirm(); removeToast(toast); };
    toast.querySelector('.toast-btn-cancel').onclick = () => { removeToast(toast); };
}

function removeToast(toast) {
    toast.classList.add('fade-out');
    // Safety: Wait 500ms (animation time) then force remove
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 500);
}

// --- 2. NOTIFICATION HISTORY (DROPDOWN) ---

document.addEventListener('DOMContentLoaded', () => {
    setupNotificationDropdown();
    updateBadge(); // Check on load
    setupThemeToggle();
    setupLogout();
    fetchNotifications(); // Fetch real notifications

    // Poll for new notifications every 10 seconds
    setInterval(fetchNotifications, 10000);
});

// Fetch notifications from backend
async function fetchNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const notifications = await response.json();
        saveNotificationsToStorage(notifications);
        updateBadge();
    } catch (err) {
        console.error('Error fetching notifications:', err);
    }
}

// Save notifications to localStorage and update badge
function saveNotificationsToStorage(notifications) {
    localStorage.setItem('backend_notifications', JSON.stringify(notifications));

    // Check if there are unread notifications
    const hasUnread = notifications.some(n => !n.is_read);
    localStorage.setItem('coco_has_unread', hasUnread ? 'true' : 'false');
}

function saveToHistory(message) {
    // Get existing
    const existing = JSON.parse(localStorage.getItem('coco_notifications') || '[]');

    // Add new one to top
    const newNotif = {
        msg: message,
        time: new Date().toLocaleString()
    };
    existing.unshift(newNotif);

    // Keep only last 20
    if (existing.length > 20) existing.pop();

    // Save back
    localStorage.setItem('coco_notifications', JSON.stringify(existing));
    localStorage.setItem('coco_has_unread', 'true'); // Flag for red dot

    updateBadge();
    renderHistory(); // If dropdown is open, update it live
}

function setupNotificationDropdown() {
    const btn = document.getElementById('notif-btn');
    const dropdown = document.getElementById('notif-dropdown');
    const clearBtn = document.getElementById('clear-notifs');

    if (!btn || !dropdown) return;

    // Toggle Dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('active');

        if (isOpen) {
            dropdown.classList.remove('active');
        } else {
            dropdown.classList.add('active');
            renderHistory();
            // Mark all as read
            markAllNotificationsAsRead();
            // Clear red dot when opened
            localStorage.setItem('coco_has_unread', 'false');
            updateBadge();
        }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Clear All
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllNotifications();
        });
    }
}

// Clear all notifications from database and localStorage
async function clearAllNotifications() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/notifications/delete-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Error clearing notifications');
            showToast('Failed to clear notifications');
            return;
        }

        // Clear from localStorage
        localStorage.removeItem('backend_notifications');
        localStorage.removeItem('coco_notifications');
        localStorage.removeItem('coco_has_unread');

        // Refresh UI
        renderHistory();
        updateBadge();
    } catch (err) {
        console.error('Error clearing notifications:', err);
    }
}

// Mark all unread notifications as read
async function markAllNotificationsAsRead() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const notifications = JSON.parse(localStorage.getItem('backend_notifications') || '[]');

    for (const notif of notifications) {
        if (!notif.is_read) {
            try {
                await fetch('/api/auth/notifications/read', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ notification_id: notif.notification_id })
                });
            } catch (err) {
                console.error('Error marking notification as read:', err);
            }
        }
    }

    // Refresh notifications
    fetchNotifications();
}

function renderHistory() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const backendNotifs = JSON.parse(localStorage.getItem('backend_notifications') || '[]');
    const localNotifs = JSON.parse(localStorage.getItem('coco_notifications') || '[]');

    // Combine both sources, prioritize backend notifications
    const allNotifs = [
        ...backendNotifs.map(n => {
            let actionMsg = '📥 downloaded';
            let icon = '📥';

            if (n.action_type === 'upvote') {
                actionMsg = '👍 upvoted';
                icon = '👍';
            } else if (n.action_type === 'save') {
                actionMsg = '🔖 saved';
                icon = '🔖';
            }

            return {
                msg: `${n.actor_name} ${actionMsg} your note: "${n.note_title}"`,
                time: new Date(n.created_at).toLocaleString(),
                is_read: n.is_read,
                note_id: n.note_id,
                notification_id: n.notification_id,
                action_type: n.action_type
            };
        }),
        ...localNotifs
    ];

    if (allNotifs.length === 0) {
        list.innerHTML = '<p class="empty-msg">No notifications yet 🥥</p>';
        return;
    }

    list.innerHTML = allNotifs.map(item => `
        <div class="notif-item ${item.is_read === false ? 'unread' : ''}" 
             ${item.note_id ? `onclick="window.location.href='note-details.html?id=${item.note_id}'"` : ''}>
            <span>${item.msg}</span>
            <span class="notif-time">${item.time}</span>
        </div>
    `).join('');
}

function updateBadge() {
    const badge = document.getElementById('notif-badge');
    const hasUnread = localStorage.getItem('coco_has_unread') === 'true';
    if (badge) {
        badge.style.display = hasUnread ? 'block' : 'none';
    }
}

// --- 3. GLOBAL UI HELPERS ---

function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    themeBtn.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showConfirm("Are you sure you want to log out from CocoNote?", () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    });
}
