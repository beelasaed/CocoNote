document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept') || 'All';
    const deptTitle = document.getElementById('dept-title-heading');
    
    if(deptTitle) deptTitle.innerText = `${dept} Department Notes`;

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
    } catch (err) { console.error("Error:", err); }
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
        popularContainer.innerHTML = popularItems.map(n => `
            <div class="popular-card">
                <span class="category-tag">${n.category}</span>
                <h4 style="margin: 12px 0; font-size: 1.25rem; font-weight: 700;">${n.title}</h4>
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 12px;">${n.course} • Batch ${n.batch}</p>
                
                <div class="stats-row-aesthetic">
                    <div class="stat-pill">
                        <span class="icon">🥥</span> ${n.upvotes || 0}
                    </div>
                    <div class="stat-pill">
                        <span class="icon">⬇️</span> ${n.downloads || 0}
                    </div>
                </div>

                <a href="${n.file_path}" target="_blank" class="btn-coco-earth" style="display:block; text-align:center; text-decoration:none; margin-top:15px;">
                    Download
                </a>
            </div>
        `).join('');
    }

    // 2. ALL NOTES (List View)
    if (allContainer) {
        if (notes.length === 0) {
            allContainer.innerHTML = `<p style="text-align:center; color:#888; padding:20px;">No notes found matching your criteria.</p>`;
        } else {
            allContainer.innerHTML = notes.map(n => `
                <div class="note-row-card">
                    <div class="note-info">
                        <h4>${n.title}</h4>
                        <div class="note-meta">
                            ${n.course} • Batch ${n.batch} • <span class="category-tag small">${n.category}</span>
                        </div>
                        <div class="uploader-info">Uploaded by ${n.uploader}</div>
                    </div>
                    
                    <div class="note-actions">
                        <div class="stats-group-aesthetic">
                            <div class="stat-pill minimal">
                                <span class="icon">🥥</span> ${n.upvotes || 0}
                            </div>
                            <div class="stat-pill minimal">
                                <span class="icon">⬇️</span> ${n.downloads || 0}
                            </div>
                        </div>

                        <div class="btn-group">
                            <a href="${n.file_path}" target="_blank" class="btn-coco-earth small" style="text-decoration:none;">Download</a>
                            <button class="btn-coco-save">🔖</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
}