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
