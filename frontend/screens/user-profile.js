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

        // Fetch star status
        let isStarred = false;
        try {
            const starResponse = await fetch(`/api/social/status?target_id=${userId}&target_type=user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const starData = await starResponse.json();
            isStarred = starData.is_starred;
        } catch (e) {
            console.error("Error fetching star status:", e);
        }

        // Render user profile
        renderUserProfile(user, isStarred);

        // Load user's notes
        loadUserNotes(userId); // Load notes dynamically

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

function renderUserProfile(user, isStarred) {
    const userSection = document.getElementById('userProfileSection');

    const joinDate = new Date(user.created_at);
    const joinedAt = joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    userSection.innerHTML = `
        <div class="profile-meta">
            <div class="large-avatar">
                ${user.profile_picture ? `<img src="${user.profile_picture}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : '👤'}
            </div>
            <div class="user-details" style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h1>${user.name}</h1>
                    <button id="star-user-btn" class="star-btn ${isStarred ? 'starred' : ''}" data-id="${user.user_id}">
                        <i class="${isStarred ? 'ri-star-fill' : 'ri-star-line'}"></i>
                    </button>
                </div>
                <p><i class="ri-building-line"></i> ${user.department || 'N/A'} • <i class="ri-calendar-line"></i> Batch ${user.batch || 'N/A'}</p>
                ${user.bio ? `<p class="user-bio" style="margin-top: 10px; color: var(--coco-brown); opacity: 0.9; line-height: 1.5;">${user.bio}</p>` : ''}
                <div style="font-size: 0.85rem; color: #999; margin-top: 8px; margin-bottom: 20px;">
                    <i class="ri-login-box-line"></i> Joined ${joinedAt}
                </div>
            </div>
        </div>

        <div class="user-stats-bar">
            <div class="stat-box">
                <span class="stat-num" style="color: var(--coco-gold);">${formatNumber(user.total_points || 0)}</span>
                <span class="stat-label">Coco Points</span>
            </div>
            <div class="stat-box">
                <span class="stat-num">${formatNumber(user.follower_count || 0)}</span>
                <span class="stat-label">Followers</span>
            </div>
            <div class="stat-box">
                <span class="stat-num">${formatNumber(user.following_count || 0)}</span>
                <span class="stat-label">Following</span>
            </div>
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

    // Add star button listener
    const starBtn = document.getElementById('star-user-btn');
    if (starBtn) {
        starBtn.addEventListener('click', () => toggleStar(user.user_id, 'user', starBtn));
    }

    // Add achievements section
    addAchievementsSection(user);

    // Add star button styles if not present
    if (!document.getElementById('star-button-styles')) {
        const style = document.createElement('style');
        style.id = 'star-button-styles';
        style.innerHTML = `
            .star-btn {
                background: none;
                border: 2px solid var(--coco-gold);
                color: var(--coco-gold);
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .star-btn:hover {
                transform: scale(1.1);
                background: rgba(215, 174, 108, 0.1);
            }
            .star-btn.starred {
                background: var(--coco-gold);
                color: white;
                box-shadow: 0 4px 15px rgba(215, 174, 108, 0.4);
            }
            .star-btn.starred i {
                animation: star-pop 0.3s ease;
            }
            @keyframes star-pop {
                0% { transform: scale(1); }
                50% { transform: scale(1.4); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

async function toggleStar(targetId, targetType, btn) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/social/toggle', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ target_id: targetId, target_type: targetType })
        });
        const data = await response.json();
        if (data.success) {
            const icon = btn.querySelector('i');
            if (data.action === 'STARRED') {
                icon.className = 'ri-star-fill';
                btn.classList.add('starred');
            } else {
                icon.className = 'ri-star-line';
                btn.classList.remove('starred');
            }
        } else {
            alert(data.message || "Something went wrong");
        }
    } catch (err) {
        console.error("Error toggling star:", err);
    }
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

// Format number (k/m)
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

// --- DYNAMIC NOTES LOADING ---
async function loadUserNotes(userId) {
    const token = localStorage.getItem('token');
    const notesContainer = document.getElementById('tab-content');

    if (!notesContainer) return; // Should exist from HTML

    // Show loading state
    notesContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Loading notes...</p>';

    try {
        const response = await fetch(`/api/notes/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch notes');

        const notes = await response.json();

        if (notes.length === 0) {
            notesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="ri-file-text-line" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                    <p>This user hasn't uploaded any notes yet.</p>
                </div>
            `;
            return;
        }

        // Inject styles for note cards if not present
        if (!document.getElementById('note-card-styles')) {
            const style = document.createElement('style');
            style.id = 'note-card-styles';
            style.innerHTML = `
                .notes-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                    padding: 1rem 0;
                }
                .note-card {
                    background: var(--coco-white);
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                    border: 1px solid rgba(0,0,0,0.04);
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                .note-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 25px rgba(215, 174, 108, 0.2);
                    border-color: var(--coco-gold);
                }
                .note-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .note-icon-box {
                    width: 40px;
                    height: 40px;
                    background: var(--coco-cream);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: var(--coco-earth);
                }
                .note-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--coco-earth);
                    margin: 0;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .note-meta {
                    font-size: 0.85rem;
                    color: #888;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .note-stats {
                    display: flex;
                    gap: 15px;
                    margin-top: auto;
                    padding-top: 1rem;
                    border-top: 1px solid #f0f0f0;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #666;
                }
                .stat-item { display: flex; align-items: center; gap: 5px; }
            `;
            document.head.appendChild(style);
        }

        const gridHTML = notes.map(note => `
            <div class="note-card" onclick="window.location.href='note-details.html?id=${note.note_id}'">
                <div class="note-header">
                    <div class="note-icon-box">📄</div>
                    <span class="note-meta">${new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <h3 class="note-title">${note.title}</h3>
                <div class="note-meta">
                    <i class="ri-book-line"></i> ${note.course_code || 'General'}
                    <span style="margin: 0 5px;">•</span>
                     Batch ${note.batch}
                </div>
                <div class="note-stats">
                    <div class="stat-item"><i class="ri-thumb-up-line"></i> ${note.upvotes || 0}</div>
                    <div class="stat-item"><i class="ri-download-line"></i> ${note.downloads || 0}</div>
                </div>
            </div>
        `).join('');

        notesContainer.innerHTML = `<div class="notes-grid">${gridHTML}</div>`;

    } catch (err) {
        console.error('Error loading notes:', err);
        notesContainer.innerHTML = '<p style="text-align: center; color: #c33;">Failed to load notes.</p>';
    }
}
