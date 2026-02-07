document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!userId) {
        document.getElementById('userProfileSection').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c33;">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <p>Invalid user ID</p>
            </div>
        `;
        return;
    }

    try {
        // Fetch public user profile
        const response = await fetch(`/api/auth/profile/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('User not found');
        }

        const user = await response.json();
        console.log('User Profile:', user);

        // Render user profile
        renderUserProfile(user);

        // Load user's notes
        loadUserNotes(userId, token);

    } catch (err) {
        console.error('Error:', err);
        document.getElementById('userProfileSection').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c33;">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <p>${err.message}</p>
            </div>
        `;
    }
});

function renderUserProfile(user) {
    const userSection = document.getElementById('userProfileSection');

    const joinDate = new Date(user.created_at);
    const joinedAt = joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    userSection.innerHTML = `
        <div class="profile-meta">
            <div class="large-avatar">👤</div>
            <div class="user-details">
                <h1>${user.name}</h1>
                <p><i class="ri-building-line"></i> ${user.department || 'N/A'} • <i class="ri-calendar-line"></i> Batch ${user.batch || 'N/A'}</p>
                <div style="font-size: 0.85rem; color: #999; margin-top: 8px; margin-bottom: 20px;">
                    <i class="ri-login-box-line"></i> Joined ${joinedAt}
                </div>
            </div>
        </div>

        <div class="user-stats-bar">
            <div class="stat-box">
                <span class="stat-num">${user.notes_uploaded || 0}</span>
                <span class="stat-label">Notes Uploaded</span>
            </div>
            <div class="stat-box">
                <span class="stat-num">${formatNumber(user.total_downloads || 0)}</span>
                <span class="stat-label">Total Downloads</span>
            </div>
            <div class="stat-box">
                <span class="stat-num">${formatNumber(user.total_upvotes || 0)}</span>
                <span class="stat-label">Total Upvotes</span>
            </div>
        </div>
    `;

    // Add achievements section
    addAchievementsSection(user);
}

function getAchievements(user) {
    // Map of obtained badge names for easy lookup
    const earnedBadges = new Set((user.badges || []).map(b => b.name));

    // Define badge requirements and conditions
    const badges = [
        {
            title: 'Getting Started',
            icon: '📝',
            description: 'Upload your first note',
            achieved: earnedBadges.has('Getting Started')
        },
        {
            title: 'Prolific Creator',
            icon: '📚',
            description: 'Upload 10 or more notes',
            achieved: earnedBadges.has('Prolific Creator')
        },
        {
            title: 'Popular Author',
            icon: '⭐',
            description: 'Receive 50 or more total upvotes',
            achieved: earnedBadges.has('Popular Author')
        },
        {
            title: 'Viral Creator',
            icon: '🔥',
            description: 'Get 200 or more total downloads',
            achieved: earnedBadges.has('Viral Creator')
        },
        {
            title: 'Coconut Expert',
            icon: '🥥',
            description: 'Earn 1,000 coconut points',
            achieved: earnedBadges.has('Coconut Expert')
        },
        {
            title: 'CocoNote Legend',
            icon: '👑',
            description: 'Upload 10+ notes, 50+ upvotes, 3000+ points',
            achieved: earnedBadges.has('CocoNote Legend')
        }
    ];

    return badges;
}

function addAchievementsSection(user) {
    const badges = getAchievements(user);
    const userSection = document.getElementById('userProfileSection');

    // Remove existing achievements section if any
    const existingSection = document.querySelector('.badges-card');
    if (existingSection) existingSection.remove();

    const section = document.createElement('section');
    section.className = 'badges-card animate-up';
    section.style.animationDelay = '0.1s';

    section.innerHTML = `
        <h3 class="section-subtitle"><i class="ri-award-line"></i> Achievements</h3>
        <div class="badges-grid">
            ${badges.map(badge => `
                <div class="badge-item ${badge.achieved ? '' : 'locked'} tooltip" data-tip="<strong>${badge.title}</strong><br>${badge.description}<br><br><small>${badge.achieved ? '✅ Earned' : '🔒 Locked'}</small>">
                    <div class="badge-icon" style="opacity: ${badge.achieved ? '1' : '0.4'}; filter: ${badge.achieved ? 'none' : 'grayscale(100%)'};">
                        ${badge.icon}
                    </div>
                    ${!badge.achieved ? '<div class="lock-icon"><i class="ri-lock-line"></i></div>' : ''}
                    <span>${badge.title}</span>
                </div>
            `).join('')}
        </div>
    `;

    userSection.parentNode.insertBefore(section, userSection.nextSibling);

    // Add tooltip functionality (Simple version)
    // We can reuse the tooltip logic if it was global, but let's just add title for simple tooltip
    // or copy helper if needed. For now relying on css tooltip or simple title.
    // user-profile.js doesn't seem to have the tooltip logic, adding it.
    addBadgeTooltips();
}

function addBadgeTooltips() {
    const badges = document.querySelectorAll('.badge-item.tooltip');

    badges.forEach(badge => {
        badge.addEventListener('mouseenter', function (e) {
            const tooltip = document.querySelector('.badge-tooltip');
            if (tooltip) tooltip.remove();

            const tip = this.dataset.tip;
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'badge-tooltip';
            tooltipEl.innerHTML = tip;

            document.body.appendChild(tooltipEl);

            const rect = this.getBoundingClientRect();
            tooltipEl.style.position = 'fixed';
            tooltipEl.style.zIndex = '1000';
            tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + 'px';
            tooltipEl.style.left = (rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2) + 'px';

            // Basic Styling if not in CSS
            tooltipEl.style.background = 'rgba(0,0,0,0.85)';
            tooltipEl.style.color = '#fff';
            tooltipEl.style.padding = '8px 12px';
            tooltipEl.style.borderRadius = '6px';
            tooltipEl.style.fontSize = '0.8rem';
            tooltipEl.style.pointerEvents = 'none';
        });

        badge.addEventListener('mouseleave', function () {
            const tooltip = document.querySelector('.badge-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

async function loadUserNotes(userId, token) {
    try {
        // Fetch all notes first
        const response = await fetch('/api/notes/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const allNotes = await response.json();

        // Filter to only this user's notes
        const userNotes = allNotes.filter(note => note.uploader_id === parseInt(userId));

        // Render notes section
        renderNotesSection(userNotes);

    } catch (err) {
        console.error('Error loading notes:', err);
    }
}

function renderNotesSection(notes) {
    let tabContent = document.querySelector('#tab-content');

    if (!tabContent) {
        const container = document.querySelector('.profile-container');
        const section = document.createElement('section');
        section.className = 'profile-content-card animate-up';
        section.style.animationDelay = '0.2s';

        section.innerHTML = `
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="my-uploads">Notes Uploaded</button>
            </div>
            <div id="tab-content" class="tab-content"></div>
        `;

        container.appendChild(section);
        tabContent = section.querySelector('#tab-content');
    }

    if (notes.length === 0) {
        tabContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="ri-file-text-line" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                <p>This user hasn't uploaded any notes yet.</p>
            </div>
        `;
    } else {
        tabContent.innerHTML = `
            <div class="notes-grid" style="display: grid; gap: 20px;">
                ${notes.map(note => `
                    <div class="note-card-item" data-note-id="${note.note_id}" style="cursor: pointer; padding: 18px; background: white; border: 1px solid rgba(215, 174, 108, 0.2); border-radius: 12px; transition: all 0.3s ease;">
                        <h4 style="margin: 0 0 10px 0; color: var(--earth-brown); font-size: 1.1rem;">${note.title}</h4>
                        <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666; line-height: 1.5;">${note.description ? note.description.substring(0, 100) + '...' : 'No description'}</p>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #999; margin-bottom: 12px;">
                            <span><i class="ri-book-line"></i> ${note.course}</span>
                            <span><i class="ri-calendar-line"></i> Batch ${note.batch}</span>
                        </div>
                        <div style="display: flex; gap: 15px; font-size: 0.85rem; color: #666;">
                            <span><i class="ri-thumb-up-line"></i> ${note.upvotes || 0} Upvotes</span>
                            <span><i class="ri-download-line"></i> ${note.downloads || 0} Downloads</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click listeners to navigate to note details
        document.querySelectorAll('.note-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.getAttribute('data-note-id');
                window.location.href = `note-details.html?id=${noteId}`;
            });
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
