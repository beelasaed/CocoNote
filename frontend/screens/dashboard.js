document.addEventListener('DOMContentLoaded', () => {
    // Theme and Logout are handled by notifications.js
    setupDashboardSearchAndFilters();
    fetchAnalytics();
});

let dashboardNotes = [];
let searchType = 'notes'; // 'notes' or 'people'

async function fetchAnalytics() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('/api/notes/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            renderAnalytics(data);
        } else {
            console.error("Failed to fetch analytics:", data.message);
        }
    } catch (err) {
        console.error("Error fetching analytics:", err);
    }
}

function renderAnalytics(data) {
    const { topContributors, mostDownloaded, deptActivity, courseStats } = data;

    // Top Contributors
    const tcList = document.getElementById('top-contributors');
    if (tcList) {
        tcList.innerHTML = topContributors.length ? topContributors.map(u => `
            <div class="stat-item" onclick="window.location.href='user-profile.html?id=${u.user_id}'" style="cursor: pointer;">
                <span class="stat-name">${u.name}</span>
                <span class="stat-value">${u.note_count} notes</span>
            </div>
        `).join('') : '<p>No data available</p>';
    }

    // Most Downloaded
    const mdList = document.getElementById('most-downloaded');
    if (mdList) {
        mdList.innerHTML = mostDownloaded.length ? mostDownloaded.map(n => `
            <div class="stat-item" onclick="window.location.href='note-details.html?id=${n.note_id}'" style="cursor: pointer;">
                <span class="stat-name" title="${n.title}">${n.title}</span>
                <span class="stat-value">${n.downloads} 📥</span>
            </div>
        `).join('') : '<p>No data available</p>';
    }

    // Dept Activity
    const daList = document.getElementById('dept-activity');
    if (daList) {
        daList.innerHTML = deptActivity.length ? deptActivity.map(d => `
            <div class="stat-item">
                <span class="stat-name">${d.name}</span>
                <span class="stat-value">${d.note_count} notes</span>
            </div>
        `).join('') : '<p>No data available</p>';
    }

    // Course Stats
    const csList = document.getElementById('course-stats');
    if (csList) {
        csList.innerHTML = courseStats.length ? courseStats.map(c => `
            <div class="stat-item">
                <span class="stat-name">${c.name}</span>
                <span class="stat-value">${c.note_count}</span>
            </div>
        `).join('') : '<p>No data available</p>';
    }
}

async function fetchDashboardNotes() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    try {
        const response = await fetch('/api/notes/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            dashboardNotes = data;
        } else {
            console.error("Failed to fetch notes for dashboard search:", data.message);
        }
    } catch (err) {
        console.error("Error fetching notes for dashboard search:", err);
    }
}

function setupDashboardSearchAndFilters() {
    const searchInput = document.getElementById('dashboard-search-input');
    const filterSelects = document.querySelectorAll('.search-filters .filter-pill');
    const applyButton = document.querySelector('.search-filters .filter-pill-btn');
    const typeBtns = document.querySelectorAll('.search-type-btn');
    const notesFilters = document.getElementById('notes-filters');

    if (!searchInput) return;

    // Handle Search Type Toggle
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            searchType = btn.dataset.type;

            if (searchType === 'people') {
                searchInput.placeholder = "Search people by name or student ID...";
                if (notesFilters) notesFilters.style.display = 'none';
            } else {
                searchInput.placeholder = "Search by course, title, or keyword...";
                if (notesFilters) notesFilters.style.display = 'flex';
            }

            handleSearch();
        });
    });

    const [batchSelect, categorySelect] = filterSelects;

    if (batchSelect && batchSelect.options.length <= 1) {
        const batches = ['19', '20', '21', '22'];
        batches.forEach(batch => {
            const opt = document.createElement('option');
            opt.value = batch;
            opt.textContent = batch;
            batchSelect.appendChild(opt);
        });
    }

    if (categorySelect && categorySelect.options.length <= 1) {
        const categories = [
            { value: 'Slides', label: 'Lecture Slides' },
            { value: 'Papers', label: 'Past Papers' },
            { value: 'Lab', label: 'Lab Reports' },
            { value: 'Books', label: 'Reference Books' },
        ];
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.value;
            opt.textContent = cat.label;
            categorySelect.appendChild(opt);
        });
    }

    fetchDashboardNotes();

    async function handleSearch() {
        if (searchType === 'people') {
            await applyUserSearch();
        } else {
            applyDashboardFiltersAndRender();
        }
    }

    function applyDashboardFiltersAndRender() {
        if (!dashboardNotes.length) {
            fetchDashboardNotes();
            return;
        }

        const search = searchInput.value.trim().toLowerCase();
        const rawBatch = batchSelect ? batchSelect.value : '';
        const rawCategory = categorySelect ? categorySelect.value : '';
        const batch = (!rawBatch || rawBatch === 'Batch') ? '' : rawBatch;
        const category = (!rawCategory || rawCategory === 'Category') ? '' : rawCategory;

        if (!search && !batch && !category) {
            renderDashboardResults([]);
            return;
        }

        const filtered = dashboardNotes.filter(note => {
            const matchesSearch = search
                ? (note.title?.toLowerCase().includes(search) ||
                    note.course?.toLowerCase().includes(search) ||
                    note.course_code?.toLowerCase().includes(search))
                : true;
            const matchesBatch = batch ? note.batch == batch : true;
            const matchesCategory = category ? note.category === category : true;
            return matchesSearch && matchesBatch && matchesCategory;
        });

        renderDashboardResults(filtered);
    }

    async function applyUserSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            renderUserResults([]);
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/social/search?query=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();
            renderUserResults(users);
        } catch (err) {
            console.error("User Search Error:", err);
        }
    }

    if (applyButton) applyButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
    if (batchSelect) batchSelect.addEventListener('change', handleSearch);
    if (categorySelect) categorySelect.addEventListener('change', handleSearch);

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });
}

function renderDashboardResults(notes) {
    const heroCard = document.querySelector('.search-hero-card');
    if (!heroCard) return;

    let resultsContainer = document.getElementById('dashboard-search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'dashboard-search-results';
        resultsContainer.className = 'dashboard-search-results';
        heroCard.appendChild(resultsContainer);
    }

    if (!notes.length) {
        resultsContainer.innerHTML = `<p class="dashboard-results-empty">No matching notes found.</p>`;
        return;
    }

    const topFive = notes.slice(0, 5);
    resultsContainer.innerHTML = `
        <div class="dashboard-results-header">Search Results (${topFive.length}${notes.length > 5 ? ' of ' + notes.length : ''})</div>
        <div class="dashboard-result-list">
            ${topFive.map(n => `
                <div class="dashboard-result-card" onclick="window.location.href='note-details.html?id=${n.note_id}'" style="cursor: pointer;">
                    <div class="dashboard-result-main">
                        <div class="dashboard-result-title">${n.title}</div>
                        <div class="dashboard-result-meta">${n.course || 'Course'} • Batch ${n.batch || '-'} ${n.category ? ' • ' + n.category : ''}</div>
                        <div class="dashboard-result-stats">🥥 ${n.upvotes || 0} • ⬇️ ${n.downloads || 0} ${n.uploader ? ' • ' + n.uploader : ''}</div>
                    </div>
                    <a href="note-details.html?id=${n.note_id}" class="dashboard-result-link">View Details</a>
                </div>
            `).join('')}
        </div>
    `;
}

function renderUserResults(users) {
    const heroCard = document.querySelector('.search-hero-card');
    if (!heroCard) return;

    let resultsContainer = document.getElementById('dashboard-search-results');
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'dashboard-search-results';
        resultsContainer.className = 'dashboard-search-results';
        heroCard.appendChild(resultsContainer);
    }

    if (!users.length) {
        resultsContainer.innerHTML = `<p class="dashboard-results-empty">No users found.</p>`;
        return;
    }

    resultsContainer.innerHTML = `
        <div class="dashboard-results-header">People (${users.length})</div>
        <div class="dashboard-result-list">
            ${users.map(u => `
                <div class="dashboard-result-card" onclick="window.location.href='user-profile.html?id=${u.user_id}'" style="cursor: pointer;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--coco-cream); overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--coco-gold);">
                            ${u.profile_picture ? `<img src="${u.profile_picture}" style="width: 100%; height: 100%; object-fit: cover;">` : u.name[0]}
                        </div>
                        <div class="dashboard-result-main">
                            <div class="dashboard-result-title">${u.name}</div>
                            <div class="dashboard-result-meta">${u.department || 'No Dept'} • Batch ${u.batch || '-'} • ${u.student_id}</div>
                            <div class="dashboard-result-stats">👥 ${u.follower_count || 0} followers</div>
                        </div>
                    </div>
                    <a href="user-profile.html?id=${u.user_id}" class="dashboard-result-link">View Profile</a>
                </div>
            `).join('')}
        </div>
    `;
}
