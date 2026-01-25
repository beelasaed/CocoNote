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
});

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
            localStorage.removeItem('coco_notifications');
            renderHistory();
        });
    }
}

function renderHistory() {
    const list = document.getElementById('notif-list');
    if (!list) return;

    const data = JSON.parse(localStorage.getItem('coco_notifications') || '[]');

    if (data.length === 0) {
        list.innerHTML = '<p class="empty-msg">No notifications yet 🥥</p>';
        return;
    }

    list.innerHTML = data.map(item => `
        <div class="notif-item">
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