document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('id');
    const container = document.getElementById('noteDetailView');
    const token = localStorage.getItem('token');

    console.log('Note ID from URL:', noteId);
    console.log('Token exists:', !!token);

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (!noteId) {
        container.innerHTML = '<div class="error-message">Invalid note ID</div>';
        return;
    }

    try {
        // Fetch note details from API
        const response = await fetch(`/api/notes/${noteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch note');
        }

        const note = data;

        // Format the date
        const createdDate = new Date(note.created_at);
        const dateString = createdDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        // Build the HTML
        const activeClass = note.is_upvoted ? 'active-upvote' : '';

        container.innerHTML = `
            <div class="pdf-section">
                <h1>${note.title}</h1>
                <p>${note.description || 'No description provided'}</p>
                <div class="pdf-preview" id="pdfPreviewContainer">
                    ${note.file_path ? `<embed src="${note.file_path}#toolbar=0" type="application/pdf" style="width: 100%; height: 100%; border: none; border-radius: 20px;" />` : `
                    <i class="ri-file-pdf-fill"></i>
                    <p>PDF Binary Stream Preview</p>
                    `}
                </div>
            </div>
            <div class="info-sidebar">
                <div class="note-details-card">
                    <h4>📋 Note Details</h4>
                    <div class="details-list">
                        <div class="detail-item">
                            <strong>Course</strong>
                            <div class="detail-item-value">${note.course_name || 'N/A'}</div>
                            <div style="font-size: 0.85rem; color: #999; margin-top: 2px;">${note.course_code || ''}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Batch</strong>
                            <div class="detail-item-value">${note.batch || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Department</strong>
                            <div class="detail-item-value">${note.department || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Category</strong>
                            <div class="category-badge">${note.category || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Uploader</strong>
                            <div class="detail-item-value">${note.uploader || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <strong>Date</strong>
                            <div class="detail-item-value">${dateString}</div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <a href="${note.file_path || ''}" 
                           target="_blank" 
                           class="download-btn-details"
                           data-note-id="${note.note_id}">
                            <i class="ri-download-cloud-2-line"></i> Download PDF
                        </a>

                        <div class="upvote-section">
                            <button class="btn-upvote-details ${activeClass}" data-note-id="${note.note_id}">
                                <span>🥥</span> <span class="upvote-count">${note.upvotes || 0}</span>
                            </button>
                            <div class="stat-pill">
                                <span>⬇️</span> <span>${note.downloads || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Attach event listeners
        attachDetailsEventListeners(noteId);

    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = '<div class="error-message">Failed to load note details. Please try again.</div>';
    }
});

function attachDetailsEventListeners(noteId) {
    // Upvote button
    const upvoteBtn = document.querySelector('.btn-upvote-details');
    if (upvoteBtn) {
        upvoteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch('/api/notes/upvote/json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ note_id: noteId })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const countSpan = upvoteBtn.querySelector('.upvote-count');
                    const currentVal = parseInt(countSpan.innerText);

                    if (data.message.includes('Upvoted')) {
                        countSpan.innerText = currentVal + 1;
                        upvoteBtn.classList.add('active-upvote');
                    } else {
                        countSpan.innerText = currentVal - 1;
                        upvoteBtn.classList.remove('active-upvote');
                    }
                } else {
                    alert(data.message || 'Error upvoting note');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Failed to upvote note');
            }
        });
    }

    // Download button
    const downloadBtn = document.querySelector('.download-btn-details');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            const fileLink = downloadBtn.getAttribute('href');

            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            if (!token || !noteId) return;

            try {
                const response = await fetch('/api/notes/download/json', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ note_id: noteId })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Update the download count in the UI
                    const downloadCountSpan = document.querySelector('.stat-pill span:last-child');
                    if (downloadCountSpan) {
                        const currentDownloads = parseInt(downloadCountSpan.innerText);
                        downloadCountSpan.innerText = currentDownloads + 1;
                    }
                    
                    // Open the file in a new tab
                    if (fileLink) {
                        window.open(fileLink, '_blank');
                    }
                } else {
                    alert(data.message || 'Error tracking download');
                }
            } catch (err) {
                console.error('Download Error:', err);
                // Still open the file even if tracking fails
                if (fileLink) {
                    window.open(fileLink, '_blank');
                }
            }
        });
    }
}