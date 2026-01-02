document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('id');
    const note = CocoAPI.getNoteById(noteId) || CocoAPI.getNotes()[0];
    const container = document.getElementById('noteDetailView');

    if (container) {
        container.innerHTML = `
            <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 320px; gap: 30px;">
                <div class="pdf-section">
                    <h1 style="color: var(--earth-brown); margin-bottom: 10px;">${note.title}</h1>
                    <p style="margin-bottom: 20px; color: var(--text-gray);">${note.description}</p>
                    <div style="width:100%; height:500px; background:#e0e0e0; border-radius:15px; display:flex; align-items:center; justify-content:center; border: 2px dashed var(--soft-gold);">
                        <div style="text-align:center">
                            <i class="ri-file-pdf-fill" style="font-size: 4rem; color: var(--earth-brown);"></i>
                            <p>PDF Binary Stream Preview</p>
                        </div>
                    </div>
                </div>
                <div class="info-sidebar">
                    <div class="note-card" style="position: sticky; top: 20px;">
                        <h4 style="margin-bottom: 15px; border-bottom: 1px solid var(--bg-soft-tan); padding-bottom: 10px;">Note Details</h4>
                        <p><strong>Code:</strong> ${note.code}</p>
                        <p><strong>Batch:</strong> ${note.batch}</p>
                        <p><strong>Department:</strong> ${note.dept}</p>
                        <p><strong>Category:</strong> ${note.cat}</p>
                        <p><strong>Uploader:</strong> ${note.uploader}</p>
                        <button class="btn-gold" style="width:100%; margin-top:20px;">
                            <i class="ri-download-cloud-2-line"></i> Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
});