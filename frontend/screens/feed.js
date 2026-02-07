document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept') || 'All';
    const deptTitle = document.getElementById('dept-title-heading');

    if (deptTitle) deptTitle.innerText = `${dept} Department Notes`;

    fetchNotes();

    const searchInput = document.getElementById('note-search');
    const batchFilter = document.getElementById('batch-filter');
    const catFilter = document.getElementById('cat-filter');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (batchFilter) batchFilter.addEventListener('change', applyFilters);
    if (catFilter) catFilter.addEventListener('change', applyFilters);

});

let allNotes = [];

async function fetchNotes() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return; }

    // 1. Get the department from the URL
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept');

    // 2. Build the URL. If dept exists, add it to the API call.
    let url = '/api/notes/feed';
    if (dept && dept !== 'All') {
        url += `?dept=${encodeURIComponent(dept)}`;
    }

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            allNotes = data;
            initializeFiltersFromURL();
        } else {
            console.error("Failed to fetch notes:", data.message);
        }
    } catch (err) { console.error("Error:", err); }
}

function initializeFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search') || '';
    const batch = params.get('batch') || '';
    const category = params.get('category') || '';

    const searchInput = document.getElementById('note-search');
    const batchFilter = document.getElementById('batch-filter');
    const catFilter = document.getElementById('cat-filter');

    if (searchInput) searchInput.value = search;
    if (batchFilter && batch) batchFilter.value = batch;
    if (catFilter && category) catFilter.value = category;

    // If any filter is active, apply them; otherwise show all notes
    if (search || batch || category) {
        applyFilters();
    } else {
        renderFeed(allNotes);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('note-search').value.toLowerCase();
    const batchVal = document.getElementById('batch-filter').value;
    const catVal = document.getElementById('cat-filter').value;

    const filtered = allNotes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchTerm) ||
            note.course.toLowerCase().includes(searchTerm);
        const matchesBatch = batchVal ? note.batch == batchVal : true;
        const matchesCat = catVal ? note.category === catVal : true;

        return matchesSearch && matchesBatch && matchesCat;
    });

    renderFeed(filtered);
}

function renderFeed(notes) {
    const popularContainer = document.getElementById('popular-notes-container');
    const allContainer = document.getElementById('all-notes-container');

    // 1. POPULAR NOTES
    const popularItems = [...notes].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3);

    if (popularContainer) {
        popularContainer.innerHTML = popularItems.map(n => {
            const activeClass = n.is_upvoted ? 'active-upvote' : '';

            return `
            <div class="popular-card" data-note-id="${n.note_id}">
                <span class="category-tag">${n.category}</span>
                <h4 style="margin: 12px 0; font-size: 1.25rem; font-weight: 700;">${n.title}</h4>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 12px;">${n.course} • Batch ${n.batch}</p>
                <div class="stats-row-aesthetic">
                    <button class="stat-pill btn-upvote ${activeClass}">
                        <span class="icon">🥥</span> <span class="upvote-count">${n.upvotes || 0}</span>
                    </button>
                    <div class="stat-pill">
                        <span class="icon">⬇️</span> <span class="download-count">${n.downloads || 0}</span>
                    </div>
                </div>

                <a href="${n.file_path}" target="_blank" 
                   class="btn-coco-earth btn-download" 
                   data-note-id="${n.note_id}"
                   style="display:block; text-align:center; text-decoration:none; margin-top:15px;">
                    Download
                </a>
            </div>
        `}).join('');
    }

    // 2. ALL NOTES (List View)
    if (allContainer) {
        if (notes.length === 0) {
            allContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No notes found matching your criteria.</p>`;
        } else {
            allContainer.innerHTML = notes.map(n => {
                // FIXED 1: Calculate active class here too
                const activeClass = n.is_upvoted ? 'active-upvote' : '';
                const savedClass = n.is_saved ? 'active-save' : '';
                const bookmarkIcon = n.is_saved ? 'ri-bookmark-fill' : 'ri-bookmark-line';

                return `
                <div class="note-row-card" data-note-id="${n.note_id}">
                    <div class="note-info">
                        <h4>${n.title}</h4>
                        <div class="note-meta">
                            ${n.course} • Batch ${n.batch} • <span class="category-tag small">${n.category}</span>
                        </div>
                        <div class="uploader-info">Uploaded by ${n.uploader}</div>
                    </div>
                    
                    <div class="note-actions">
                        <div class="stats-group-aesthetic">
                             <button class="stat-pill minimal btn-upvote ${activeClass}">
                                <span class="icon">🥥</span> <span class="upvote-count">${n.upvotes || 0}</span>
                            </button>
                            <div class="stat-pill minimal">
                                <span class="icon">⬇️</span> <span class="download-count">${n.downloads || 0}</span>
                            </div>
                        </div>

                        <div class="btn-group">
                            <a href="${n.file_path}" target="_blank" 
                               class="btn-coco-earth small btn-download" 
                               data-note-id="${n.note_id}"
                               style="text-decoration:none;">Download</a>
                            <button class="btn-coco-save ${savedClass}" title="${n.is_saved ? 'Unsave note' : 'Save note'}" data-note-id="${n.note_id}">
                                <i class="${bookmarkIcon}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `}).join('');
        }
    }

    attachEventListeners();
}
function attachEventListeners() {
    // --- NOTE CARD CLICK LISTENER (Navigate to Details) ---
    document.querySelectorAll('[data-note-id]').forEach(card => {
        // Make the entire card clickable, but not if clicking on buttons
        card.addEventListener('click', (e) => {
            // Prevent navigation if clicking on a button
            if (e.target.closest('button') || e.target.closest('a.btn-download')) {
                return;
            }
            const noteId = card.dataset.noteId;
            if (noteId) {
                window.location.href = `note-details.html?id=${noteId}`;
            }
        });
        // Add pointer cursor to indicate it's clickable
        card.style.cursor = 'pointer';
    });

    // --- UPVOTE LISTENER ---
    document.querySelectorAll('.btn-upvote').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const noteCard = e.target.closest('[data-note-id]');
            const noteId = parseInt(noteCard.dataset.noteId, 10);
            const token = localStorage.getItem('token');
            const buttonElement = e.currentTarget; // FIXED: Select the button specifically

            if (!noteId || isNaN(noteId)) { alert("Invalid note selected!"); return; }
            if (!token) { window.location.href = 'login.html'; return; }

            try {
                const res = await fetch('/api/notes/upvote', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ note_id: noteId })
                });

                const data = await res.json();

                if (res.ok) {
                    const countSpan = noteCard.querySelector('.upvote-count');
                    const currentVal = parseInt(countSpan.innerText);

                    if (data.message === 'ADDED') {
                        countSpan.innerText = currentVal + 1;
                        // FIXED 4: Visually turn ON the red heart
                        buttonElement.classList.add('active-upvote');
                        if (typeof showToast === 'function') showToast("Upvoted 🥥");
                    } else if (data.message === 'REMOVED') {
                        countSpan.innerText = currentVal - 1;
                        // FIXED 4: Visually turn OFF the red heart
                        buttonElement.classList.remove('active-upvote');
                        if (typeof showToast === 'function') showToast("Upvote removed");
                    }
                } else {
                    if (typeof showToast === 'function') {
                        // Shows error message (like "Cannot upvote own note") for 4 seconds
                        showToast(data.message || 'Error upvoting note', null, null, 4000);
                    } else {
                        alert(data.message || 'Error upvoting note');
                    }
                }
            } catch (err) {
                console.error('Upvote Error:', err);
            }
        });
    });

    // --- DOWNLOAD TRACKING LISTENER ---
    document.querySelectorAll('.btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // NOTE: We do NOT use preventDefault(). We let the download happen.
            e.preventDefault();
            if (typeof showToast === 'function') {
                // We grab the file link so the toast can let them open it again if they want
                const fileLink = btn.getAttribute('href');
                showToast("Download ready!", fileLink, "Open File", 6000);
            }

            const noteId = btn.dataset.noteId;
            const token = localStorage.getItem('token');

            if (token && noteId) {
                fetch('/api/notes/download', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ note_id: noteId })
                }).then(res => res.json())
                    .then(data => {
                        if (data.message === 'TRACKED') {
                            // Update count visually
                            const card = btn.closest('[data-note-id]');
                            const countSpan = card.querySelector('.download-count');
                            if (countSpan) {
                                countSpan.innerText = parseInt(countSpan.innerText) + 1;
                            }
                        }
                    }).catch(console.error);
            }
        });
    });

    // --- SAVE BUTTON LISTENER ---
    document.querySelectorAll('.btn-coco-save').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent card click
            const noteId = btn.dataset.noteId;
            const token = localStorage.getItem('token');
            const icon = btn.querySelector('i');
            const isSaved = btn.classList.contains('active-save');

            if (!noteId || !token) return;

            try {
                const method = isSaved ? 'DELETE' : 'POST';
                const res = await fetch(`/api/notes/${noteId}/save`, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    if (isSaved) {
                        // Unsaved
                        btn.classList.remove('active-save');
                        icon.classList.remove('ri-bookmark-fill');
                        icon.classList.add('ri-bookmark-line');
                        btn.title = 'Save note';
                        if (typeof showToast === 'function') {
                            showToast("Note unsaved");
                        }
                    } else {
                        // Saved
                        btn.classList.add('active-save');
                        icon.classList.remove('ri-bookmark-line');
                        icon.classList.add('ri-bookmark-fill');
                        btn.title = 'Unsave note';
                        if (typeof showToast === 'function') {
                            showToast("Note Saved", "profile.html", "View in profile", 5000);
                        }
                    }
                } else {
                    if (typeof showToast === 'function') {
                        showToast(data.message || 'Error saving note', null, null, 3000);
                    }
                }
            } catch (err) {
                console.error('Save Note Error:', err);
                if (typeof showToast === 'function') {
                    showToast('Error saving note', null, null, 3000);
                }
            }
        });
    });
}
