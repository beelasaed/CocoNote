document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept') || 'All';
    const deptTitle = document.getElementById('dept-title-heading');
    
    // Set Header Title
    if(deptTitle) deptTitle.innerText = `${dept} Department Notes`;

    // 1. Initialize Fetching
    fetchNotes();

    // 2. Attach Event Listeners for Filters
    const searchInput = document.getElementById('note-search');
    const batchFilter = document.getElementById('batch-filter');
    const catFilter = document.getElementById('cat-filter');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (batchFilter) batchFilter.addEventListener('change', applyFilters);
    if (catFilter) catFilter.addEventListener('change', applyFilters);
});

let allNotes = []; // Store fetched notes globally for filtering

// --- Fetch Notes from Backend ---
async function fetchNotes() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/notes/feed', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            allNotes = data;
            renderFeed(allNotes);
        } else {
            console.error("Failed to fetch notes:", data.message);
        }
    } catch (err) {
        console.error("Error connecting to server:", err);
    }
}

// --- Filter Logic ---
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

// --- Render Logic ---
function renderFeed(notes) {
    const popularContainer = document.getElementById('popular-notes-container');
    const allContainer = document.getElementById('all-notes-container');

    // Logic: Top 3 notes with highest upvotes are "Popular"
    // We create a copy [...notes] to avoid sorting the main array
    const popularItems = [...notes].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 3);

    // 1. Render Popular Section
    if (popularContainer) {
        popularContainer.innerHTML = popularItems.map(n => `
            <div class="popular-card">
                <span class="category-tag">${n.category}</span>
                <h4 style="margin: 10px 0;">${n.title}</h4>
                <p style="font-size: 0.8rem; color: #666;">${n.course} • Batch ${n.batch}</p>
                <div style="margin: 15px 0; font-size: 0.9rem;">
                    <span>🥥 ${n.upvotes || 0}</span> <span style="margin-left:10px;">⬇️ ${n.downloads || 0}</span>
                </div>
                <a href="${n.file_path}" target="_blank" class="btn-coco-earth" style="display:block; text-align:center; text-decoration:none; line-height:35px;">
                    Download
                </a>
            </div>
        `).join('');
    }

    // 2. Render All Notes Section
    if (allContainer) {
        if (notes.length === 0) {
            allContainer.innerHTML = `<p style="text-align:center; color:#666; width:100%; padding:20px;">No notes found matching your criteria.</p>`;
        } else {
            allContainer.innerHTML = notes.map(n => `
                <div class="note-row-card">
                    <div class="note-info">
                        <h4>${n.title}</h4>
                        <div class="note-meta">${n.course} • Batch ${n.batch} • <span class="category-tag">${n.category}</span></div>
                        <div class="note-meta" style="font-size:0.8rem; color:#888; margin-top:5px;">Uploaded by ${n.uploader}</div>
                    </div>
                    <div class="note-stats-group">
                        <div class="stat-item">🥥 ${n.upvotes || 0}</div>
                        <div class="stat-item">⬇️ ${n.downloads || 0}</div>
                        <div class="note-btns">
                            <a href="${n.file_path}" target="_blank" class="btn-coco-earth" style="text-decoration:none;">Download</a>
                            <button class="btn-coco-save">🔖</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}