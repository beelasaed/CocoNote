document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContent = document.getElementById('tab-content');

    const myNotes = [
        { title: "Algorithm Design Slides", meta: "CSE 3501 • 540 Downloads" },
        { title: "Microprocessor Lab Manual", meta: "CSE 3502 • 120 Downloads" }
    ];

    function renderNotes(notes) {
        if (notes.length === 0) {
            tabContent.innerHTML = `<p style="text-align:center; color:#888; padding:3rem;">No notes found in this section.</p>`;
            return;
        }
        tabContent.innerHTML = notes.map(note => `
            <div class="note-row-card">
                <div class="note-info">
                    <h4>${note.title}</h4>
                    <div class="note-meta">${note.meta}</div>
                </div>
                <div class="note-btns">
                    <button class="btn-coco-earth">Edit</button>
                    <button class="btn-coco-delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    // Initial load
    renderNotes(myNotes);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const type = tab.getAttribute('data-tab');
            if(type === 'saved-notes') {
                renderNotes([]); // Demo for empty saved notes
            } else {
                renderNotes(myNotes);
            }
        });
    });
});