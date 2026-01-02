document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get('dept') || 'All';
    document.getElementById('dept-title-heading').innerText = `${dept} Department Notes`;

    // Mock Data for demo
    const mockNotes = [
        { id: 1, title: "Database Management Systems", code: "CSE 3501", batch: "19", cat: "Slides", upvotes: 142, downloads: 540, popular: true },
        { id: 2, title: "Thermodynamics Past Paper", code: "ME 4201", batch: "20", cat: "Papers", upvotes: 89, downloads: 210, popular: false },
        { id: 3, title: "Algorithms Lab Manual", code: "CSE 3502", batch: "19", cat: "Lab", upvotes: 205, downloads: 890, popular: true }
    ];

    renderFeed(mockNotes);
});

function renderFeed(notes) {
    const popularContainer = document.getElementById('popular-notes-container');
    const allContainer = document.getElementById('all-notes-container');

    // Filter for Popular Section
    const popularItems = notes.filter(n => n.popular);
    popularContainer.innerHTML = popularItems.map(n => `
        <div class="popular-card">
            <span class="category-tag">${n.cat}</span>
            <h4 style="margin: 10px 0;">${n.title}</h4>
            <p style="font-size: 0.8rem; color: #666;">${n.code} • Batch ${n.batch}</p>
            <div style="margin: 15px 0; font-size: 0.9rem;">
                <span>🥥 ${n.upvotes}</span> <span style="margin-left:10px;">⬇️ ${n.downloads}</span>
            </div>
            <button class="btn-coco-earth" style="width:100%">Download</button>
        </div>
    `).join('');

    // All Notes Section
    allContainer.innerHTML = notes.map(n => `
        <div class="note-row-card">
            <div class="note-info">
                <h4>${n.title}</h4>
                <div class="note-meta">${n.code} • Batch ${n.batch} • <span class="category-tag">${n.cat}</span></div>
            </div>
            <div class="note-stats-group">
                <div class="stat-item">🥥 ${n.upvotes}</div>
                <div class="stat-item">⬇️ ${n.downloads}</div>
                <div class="note-btns">
                    <button class="btn-coco-earth">Download</button>
                    <button class="btn-coco-save">🔖</button>
                </div>
            </div>
        </div>
    `).join('');
}