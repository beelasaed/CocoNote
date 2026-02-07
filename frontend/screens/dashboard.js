document.addEventListener('DOMContentLoaded', () => {
    // Theme and Logout are handled by notifications.js
    setupDashboardSearchAndFilters();
});

let dashboardNotes = [];

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
            // Initial render is empty (no search yet)
        } else {
            console.error("Failed to fetch notes for dashboard search:", data.message);
        }
    } catch (err) {
        console.error("Error fetching notes for dashboard search:", err);
    }
}

function setupDashboardSearchAndFilters() {
    const searchInput = document.querySelector('.search-bar-box input');
    const filterSelects = document.querySelectorAll('.search-filters .filter-pill');
    const applyButton = document.querySelector('.search-filters .filter-pill-btn');

    if (!searchInput || filterSelects.length < 2 || !applyButton) return;

    const [batchSelect, categorySelect] = filterSelects;

    // Populate Batch options (kept consistent with Feed page)
    if (batchSelect.options.length <= 1) {
        const batches = ['19', '20', '21', '22'];
        batches.forEach(batch => {
            const opt = document.createElement('option');
            opt.value = batch;
            opt.textContent = batch;
            batchSelect.appendChild(opt);
        });
    }

    // Populate Category options (kept consistent with Feed page)
    if (categorySelect.options.length <= 1) {
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

    // Fetch notes once so search/filter is instant on the dashboard
    fetchDashboardNotes();

    function applyDashboardFiltersAndRender() {
        if (!dashboardNotes.length) {
            // Notes may still be loading; try fetching again
            fetchDashboardNotes();
            return;
        }

        const search = searchInput.value.trim().toLowerCase();

        // Treat placeholder options ("Batch", "Category") as no filter
        const rawBatch = batchSelect.value;
        const rawCategory = categorySelect.value;
        const batch = (!rawBatch || rawBatch === 'Batch') ? '' : rawBatch;
        const category = (!rawCategory || rawCategory === 'Category') ? '' : rawCategory;

        if (!search && !batch && !category) {
            renderDashboardResults([]);
            return;
        }

        const filtered = dashboardNotes.filter(note => {
            const matchesSearch = search
                ? (note.title?.toLowerCase().includes(search) ||
                   note.course?.toLowerCase().includes(search))
                : true;
            const matchesBatch = batch ? note.batch == batch : true;
            const matchesCategory = category ? note.category === category : true;

            return matchesSearch && matchesBatch && matchesCategory;
        });

        renderDashboardResults(filtered);
    }

    applyButton.addEventListener('click', applyDashboardFiltersAndRender);

    // Live update on typing / changing filters
    searchInput.addEventListener('input', applyDashboardFiltersAndRender);
    batchSelect.addEventListener('change', applyDashboardFiltersAndRender);
    categorySelect.addEventListener('change', applyDashboardFiltersAndRender);

    // Allow pressing Enter in the search bar to trigger search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyDashboardFiltersAndRender();
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
        resultsContainer.innerHTML = `
            <p class="dashboard-results-empty">No matching notes found.</p>
        `;
        return;
    }

    const topFive = notes.slice(0, 5);

    resultsContainer.innerHTML = `
        <div class="dashboard-results-header">
            Search Results (${topFive.length}${notes.length > 5 ? ' of ' + notes.length : ''})
        </div>
        <div class="dashboard-result-list">
            ${topFive.map(n => `
                <div class="dashboard-result-card">
                    <div class="dashboard-result-main">
                        <div class="dashboard-result-title">${n.title}</div>
                        <div class="dashboard-result-meta">
                            ${n.course || 'Course'} • Batch ${n.batch || '-'}
                            ${n.category ? ' • ' + n.category : ''}
                        </div>
                        <div class="dashboard-result-stats">
                            🥥 ${n.upvotes || 0} • ⬇️ ${n.downloads || 0}
                            ${n.uploader ? ' • ' + n.uploader : ''}
                        </div>
                    </div>
                    ${n.file_path ? `
                        <a href="${n.file_path}" target="_blank"
                           class="dashboard-result-link">
                            Open note
                        </a>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;
}
