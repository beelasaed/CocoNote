document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch current user profile
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch profile');
        }

        const user = data;
        console.log('User Profile:', user);

        // Render user profile
        renderUserProfile(user);

        // Load user's notes
        loadUserNotes(user.user_id, token);

    } catch (err) {
        console.error('Error:', err);
        document.getElementById('userProfileSection').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c33;">
                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                <p>Failed to load profile: ${err.message}</p>
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
                <div style="font-size: 0.85rem; color: #999; margin-top: 8px;">
                    <i class="ri-mail-line"></i> ${user.email} | <i class="ri-id-card-line"></i> ${user.student_id}
                </div>
                <div style="font-size: 0.85rem; color: #999; margin-top: 4px; margin-bottom: 20px;">
                    <i class="ri-login-box-line"></i> Joined ${joinedAt}
                </div>
                <button class="btn-edit-profile" onclick="editProfile()">
                    <i class="ri-edit-line"></i> Edit Profile
                </button>
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


async function loadUserNotes(userId, token) {
    try {
        const response = await fetch('/api/notes/my-notes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const userNotes = await response.json();
        console.log('User notes:', userNotes);

        // Setup tabs and render notes section
        setupTabsAndRender(userNotes, token);

    } catch (err) {
        console.error('Error loading notes:', err);
    }
}

function setupTabsAndRender(userNotes, token) {
    let tabSection = document.querySelector('.profile-content-card');

    if (!tabSection) {
        // Create the tabs section if it doesn't exist
        const container = document.querySelector('.profile-container');
        tabSection = document.createElement('section');
        tabSection.className = 'profile-content-card animate-up';
        tabSection.style.animationDelay = '0.2s';

        tabSection.innerHTML = `
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="my-uploads">My Uploads</button>
                <button class="tab-btn" data-tab="saved-notes">Saved Notes</button>
            </div>
            <div id="tab-content" class="tab-content"></div>
        `;

        container.appendChild(tabSection);
    }

    // Add tab click listeners
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked tab
            btn.classList.add('active');

            // Render appropriate content
            const tabName = btn.dataset.tab;
            if (tabName === 'my-uploads') {
                renderNotesSection(userNotes);
            } else if (tabName === 'saved-notes') {
                loadSavedNotes(token);
            }
        });
    });

    // Render initial tab (My Uploads)
    renderNotesSection(userNotes);
}

async function loadSavedNotes(token) {
    const tabContent = document.querySelector('#tab-content');

    // Show loading state
    tabContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
            <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
            <p>Loading saved notes...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/notes/saved', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Failed to load saved notes');
        }

        const savedNotes = await response.json();
        console.log('Saved notes:', savedNotes);

        renderSavedNotes(savedNotes);

    } catch (err) {
        console.error('Error loading saved notes:', err);
        tabContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #c33;">
                <i class="ri-error-warning-line" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                <p>Failed to load saved notes</p>
            </div>
        `;
    }
}

function renderSavedNotes(notes) {
    const tabContent = document.querySelector('#tab-content');

    if (notes.length === 0) {
        tabContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="ri-bookmark-line" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                <p>You haven't saved any notes yet.</p>
                <a href="feed.html" style="color: var(--coco-gold); text-decoration: none; font-weight: 600; margin-top: 10px; display: inline-block;">
                    <i class="ri-search-line"></i> Browse Notes
                </a>
            </div>
        `;
    } else {
        tabContent.innerHTML = `
            <div class="notes-grid" style="display: grid; gap: 20px;">
                ${notes.map(note => `
                    <div class="note-card-item" data-note-id="${note.note_id}" style="cursor: pointer; padding: 18px; background: white; border: 1px solid rgba(215, 174, 108, 0.2); border-radius: 12px; transition: all 0.3s ease; hover: box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h4 style="margin: 0 0 10px 0; color: var(--earth-brown); font-size: 1.1rem;">${note.title}</h4>
                        <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666; line-height: 1.5;">${note.description ? note.description.substring(0, 100) + '...' : 'No description'}</p>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #999; margin-bottom: 12px;">
                            <span><i class="ri-book-line"></i> ${note.course}</span>
                            <span><i class="ri-calendar-line"></i> Batch ${note.batch}</span>
                            <span><i class="ri-price-tag-3-line"></i> ${note.category}</span>
                        </div>
                        <div style="display: flex; gap: 20px; font-size: 0.9rem; margin-bottom: 12px;">
                            <span style="color: var(--coco-gold); font-weight: 600;"><i class="ri-heart-line"></i> ${note.upvotes || 0} Upvotes</span>
                            <span style="color: #666;"><i class="ri-download-line"></i> ${note.downloads || 0} Downloads</span>
                            <span style="color: #888;"><i class="ri-user-line"></i> ${note.uploader}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: #aaa;">
                            <i class="ri-bookmark-fill"></i> Saved ${new Date(note.saved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click listeners to notes
        document.querySelectorAll('.note-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.dataset.noteId;
                window.location.href = `note-details.html?id=${noteId}`;
            });
        });
    }
}

function renderNotesSection(notes) {
    let tabContent = document.querySelector('#tab-content');

    if (!tabContent) {
        // Create the tabs section if it doesn't exist
        const container = document.querySelector('.profile-container');
        const section = document.createElement('section');
        section.className = 'profile-content-card animate-up';
        section.style.animationDelay = '0.2s';

        section.innerHTML = `
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="my-uploads">My Uploads</button>
            </div>
            <div id="tab-content" class="tab-content"></div>
        `;

        container.appendChild(section);
        tabContent = section.querySelector('#tab-content');
    }

    if (notes.length === 0) {
        tabContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="ri-file-upload-line" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                <p>You haven't uploaded any notes yet.</p>
                <a href="upload.html" style="color: var(--coco-gold); text-decoration: none; font-weight: 600; margin-top: 10px; display: inline-block;">
                    <i class="ri-upload-cloud-2-line"></i> Upload Your First Note
                </a>
            </div>
        `;
    } else {
        tabContent.innerHTML = `
            <div class="notes-grid" style="display: grid; gap: 20px;">
                ${notes.map(note => `
                    <div class="note-card-item" data-note-id="${note.note_id}" style="cursor: pointer; padding: 18px; background: white; border: 1px solid rgba(215, 174, 108, 0.2); border-radius: 12px; transition: all 0.3s ease; hover: box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                        <h4 style="margin: 0 0 10px 0; color: var(--earth-brown); font-size: 1.1rem;">${note.title}</h4>
                        <p style="margin: 0 0 12px 0; font-size: 0.9rem; color: #666; line-height: 1.5;">${note.description ? note.description.substring(0, 100) + '...' : 'No description'}</p>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #999; margin-bottom: 12px;">
                            <span><i class="ri-book-line"></i> ${note.course}</span>
                            <span><i class="ri-calendar-line"></i> Batch ${note.batch}</span>
                            <span><i class="ri-price-tag-3-line"></i> ${note.category}</span>
                        </div>
                        <div style="display: flex; gap: 20px; font-size: 0.9rem;">
                            <span style="color: var(--coco-gold); font-weight: 600;"><i class="ri-heart-line"></i> ${note.upvotes || 0} Upvotes</span>
                            <span style="color: #666;"><i class="ri-download-line"></i> ${note.downloads || 0} Downloads</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add click listeners to notes
        document.querySelectorAll('.note-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const noteId = card.dataset.noteId;
                window.location.href = `note-details.html?id=${noteId}`;
            });
        });
    }
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
}

function getAchievements(user) {
    // Map of obtained badge names for easy lookup
    const earnedBadges = new Set((user.badges || []).map(b => b.name));

    // Define badge requirements and conditions
    // We check against user stats for progress, but use earnedBadges for 'achieved' state to trust server source of truth (triggers)
    const badges = [
        {
            id: 'first-note',
            title: 'Getting Started',
            icon: '📝',
            description: 'Upload your first note',
            requirement: 'Upload at least 1 note',
            achieved: earnedBadges.has('Getting Started'),
            progress: `${user.notes_uploaded || 0}/1 notes`
        },
        {
            id: 'prolific-creator',
            title: 'Prolific Creator',
            icon: '📚',
            description: 'Upload 10 or more notes',
            requirement: 'Upload 10 or more notes',
            achieved: earnedBadges.has('Prolific Creator'),
            progress: `${user.notes_uploaded || 0}/10 notes`
        },
        {
            id: 'popular-author',
            title: 'Popular Author',
            icon: '⭐',
            description: 'Receive 50 or more total upvotes',
            requirement: 'Receive 50 or more total upvotes',
            achieved: earnedBadges.has('Popular Author'),
            progress: `${user.total_upvotes || 0}/50 upvotes`
        },
        {
            id: 'viral-creator',
            title: 'Viral Creator',
            icon: '🔥',
            description: 'Get 200 or more total downloads',
            requirement: 'Get 200 or more total downloads',
            achieved: earnedBadges.has('Viral Creator'),
            progress: `${user.total_downloads || 0}/200 downloads`
        },
        {
            id: 'coconut-expert',
            title: 'Coconut Expert',
            icon: '🥥',
            description: 'Earn 1,000 coconut points',
            requirement: 'Earn 1,000 coconut points',
            achieved: earnedBadges.has('Coconut Expert'),
            progress: `${user.total_points || 0}/1000 points`
        },
        {
            id: 'legend',
            title: 'CocoNote Legend',
            icon: '👑',
            description: 'Upload 10+ notes, 50+ upvotes, 3000+ points',
            requirement: 'All milestones + 3000 points',
            achieved: earnedBadges.has('CocoNote Legend'),
            progress: 'Ultimate achievement'
        }
    ];

    return badges;
}

function addAchievementsSection(user) {
    const badges = getAchievements(user);
    const container = document.querySelector('.profile-container');

    // Remove existing achievements section if any
    const existingSection = document.querySelector('.badges-card');
    if (existingSection) {
        existingSection.remove();
    }

    const section = document.createElement('section');
    section.className = 'badges-card animate-up';
    section.style.animationDelay = '0.1s';

    section.innerHTML = `
        <h3 class="section-subtitle"><i class="ri-award-line"></i> Achievements</h3>
        <div class="badges-grid">
            ${badges.map(badge => `
                <div class="badge-item ${badge.achieved ? '' : 'locked'} tooltip" data-tip="<strong>${badge.title}</strong><br>${badge.description}<br><br><small>${badge.achieved ? '✅ Earned' : '🔒 Locked'}<br>Progress: ${badge.progress}</small>">
                    <div class="badge-icon" style="opacity: ${badge.achieved ? '1' : '0.4'}; filter: ${badge.achieved ? 'none' : 'grayscale(100%)'};">
                        ${badge.icon}
                    </div>
                    ${!badge.achieved ? '<div class="lock-icon"><i class="ri-lock-line"></i></div>' : ''}
                    <span>${badge.title}</span>
                </div>
            `).join('')}
        </div>
    `;

    // Insert after user profile section
    const userSection = document.getElementById('userProfileSection');
    userSection.parentNode.insertBefore(section, userSection.nextSibling);

    // Add tooltip functionality
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
            tooltipEl.style.top = (rect.top - tooltipEl.offsetHeight - 10) + 'px';
            tooltipEl.style.left = (rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2) + 'px';
        });

        badge.addEventListener('mouseleave', function () {
            const tooltip = document.querySelector('.badge-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

function editProfile() {
    alert('Profile editing coming soon!');
    // TODO: Implement profile editing modal
}
