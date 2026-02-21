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
    setupUserProfile(); // NEW CALL

    // Poll for new notifications every 10 seconds
    setInterval(fetchNotifications, 10000);
});

// Fetch and display user profile info in Nav Bar
async function setupUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            const profileLink = document.querySelector('.profile-circle');
            if (profileLink && user.profile_picture) {
                profileLink.innerHTML = `<img src="${user.profile_picture}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                profileLink.style.padding = '0';
                profileLink.style.overflow = 'hidden';
                profileLink.title = user.name;
            }
        }
    } catch (err) {
        console.error('Error fetching user profile for nav:', err);
    }
}

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

        // --- CHECK FOR NEW BADGES ---
        const oldNotifs = JSON.parse(localStorage.getItem('backend_notifications') || '[]');
        const newBadgeNotifs = notifications.filter(n =>
            n.action_type === 'badge_earned' &&
            !n.is_read && // Only popup for unread badges
            !oldNotifs.some(old => old.notification_id === n.notification_id)
        );

        if (newBadgeNotifs.length > 0) {
            newBadgeNotifs.forEach(n => {
                showBadgePopup(n.message);
                // We no longer mark as read here. The user marks it read by clicking the notification icon.
            });
        }
        // ----------------------------

        saveNotificationsToStorage(notifications);
        updateBadge();
    } catch (err) {
        console.error('Error fetching notifications:', err);
    }
}

// --- BADGE CELEBRATION ---
function showBadgePopup(message) {
    // 1. Trigger Confetti
    triggerConfetti();

    // 2. Create Modal
    const modal = document.createElement('div');
    modal.className = 'badge-popup-modal';
    modal.innerHTML = `
        <div class="badge-popup-content animate-pop">
            <div class="badge-glow"></div>
            <div style="font-size: 5rem; margin-bottom: 10px;">🏆</div>
            <h2 style="color: var(--earth-brown); margin: 10px 0;">New Badge Unlocked!</h2>
            <p style="color: #666; margin-bottom: 20px;">${message || "You've just earned a new achievement."}</p>
            <button onclick="this.closest('.badge-popup-modal').remove()" style="
                background: var(--coco-gold); 
                color: white; 
                border: none; 
                padding: 10px 24px; 
                border-radius: 8px; 
                font-weight: 600; 
                cursor: pointer;
                transition: transform 0.2s;
            ">Awesome!</button>
        </div>
        <style>
            .badge-popup-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex; justify-content: center; align-items: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
            }
            .badge-popup-content {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                position: relative;
                overflow: hidden;
                border: 2px solid var(--coco-gold);
            }
            .badge-glow {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 200px; height: 200px;
                background: radial-gradient(circle, rgba(215, 174, 108, 0.4) 0%, transparent 70%);
                z-index: -1;
                animation: rotate 10s linear infinite;
            }
            .animate-pop {
                animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes popIn {
                from { transform: scale(0.5); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            @keyframes rotate {
                from { transform: translate(-50%, -50%) rotate(0deg); }
                to { transform: translate(-50%, -50%) rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(modal);
}

function triggerConfetti() {
    // Check if canvas-confetti is loaded, if not load it
    if (typeof confetti === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = () => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        };
        document.body.appendChild(script);
    } else {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
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
            let message = '';

            if (n.action_type === 'upvote') {
                actionMsg = '👍 upvoted';
                icon = '👍';
            } else if (n.action_type === 'save') {
                actionMsg = '🔖 saved';
                icon = '🔖';
            } else if (n.action_type === 'badge_earned') {
                // Special case for badges
                return {
                    msg: `🎉 You earned a new badge! Check your profile.`,
                    time: new Date(n.created_at).toLocaleString(),
                    is_read: n.is_read,
                    note_id: null, // Badges don't link to a note usually, or link into profile
                    notification_id: n.notification_id,
                    action_type: n.action_type
                };
            }

            message = `${n.actor_name} ${actionMsg} your note: "${n.note_title || 'Unknown Note'}"`;

            return {
                msg: message,
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

async function markNotificationRead(notificationId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        await fetch('/api/auth/notifications/read', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notification_id: notificationId })
        });
    } catch (err) {
        console.error('Error marking notification as read:', err);
    }
}
