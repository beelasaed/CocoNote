document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('id');
    const container = document.getElementById('noteDetailView');
    const token = localStorage.getItem('token');

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

        const data = await response.json();

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

        // Build the HTML for Note Details
        const activeClass = note.is_upvoted ? 'active-upvote' : '';

        container.innerHTML = `
            <div class="main-content-column">
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

                <!-- Discussion Section moved inside the main content column to stay under PDF -->
                <div class="discussion-section" id="discussionSection">
                    <div class="discussion-header">
                        <h2><i class="ri-chat-3-line"></i> Discussion <span id="commentCount">(0)</span></h2>
                        <div id="highlyDiscussedBadge" class="highly-discussed-badge" style="display: none;">
                            🔥 Highly Discussed
                        </div>
                    </div>

                    <div class="comment-input-container">
                        <textarea id="mainCommentInput" placeholder="What are your thoughts on this note?"></textarea>
                        <button class="btn-post-comment" id="btnPostComment">
                            Post Comment
                        </button>
                    </div>

                    <div class="comments-list" id="commentsList">
                        <!-- Comments injected here -->
                    </div>
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
                            <div class="detail-item-value" style="cursor: pointer; color: var(--coco-gold);" onclick="navigateToUserProfile(${note.uploader_id})">${note.uploader || 'N/A'}</div>
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

                        <!-- Rating Section -->
                        <div class="rating-container" style="margin-top: 24px; border-top: 1px solid rgba(215, 174, 108, 0.2); padding-top: 24px; border-bottom: none;">
                            <div class="rating-header">
                                <span class="rating-label">Rating</span>
                                <span class="avg-rating-text">⭐ ${note.average_rating || '0.0'} (${note.rating_count || 0})</span>
                            </div>
                            <div class="stars" id="starRating">
                                <i class="ri-star-line" data-value="1"></i>
                                <i class="ri-star-line" data-value="2"></i>
                                <i class="ri-star-line" data-value="3"></i>
                                <i class="ri-star-line" data-value="4"></i>
                                <i class="ri-star-line" data-value="5"></i>
                            </div>
                            <div id="ratingStatus" style="font-size: 0.8rem; color: #999; margin-top: 4px;">
                                ${note.user_rating ? 'Your rating: ' + note.user_rating : 'Click to rate'}
                            </div>
                        </div>

                        <!-- Edit Button (Owner Only) -->
                        <div id="owner-actions" style="display: none;">
                            <button class="edit-btn-sidebar" id="openEditModal">
                                <i class="ri-edit-line"></i> Edit Note Details
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Version History (In Sidebar) -->
                <div class="note-details-card version-history" style="margin-top: 24px; display: none;" id="version-history-section">
                    <h4 style="border: none; margin-bottom: 0;">📜 Version History</h4>
                    <div class="version-list" id="version-list">
                        <!-- Versions injected here -->
                    </div>
                </div>

                <!-- Notification Preference (In Sidebar - Injected for Owner) -->
                <div id="notif-pref-container"></div>
            </div>
        `;

        // Attach event listeners
        attachDetailsEventListeners(noteId, note.user_rating, note);
        fetchVersionHistory(noteId, token);

        // Check if owner
        const user = JSON.parse(localStorage.getItem('user'));
        const isOwner = user && user.user_id === note.uploader_id;

        if (isOwner) {
            document.getElementById('owner-actions').style.display = 'block';

            // Inject Notification Toggle for Owner
            document.getElementById('notif-pref-container').innerHTML = `
                <div class="note-details-card" style="margin-top: 24px;">
                    <h4>🔔 Notifications</h4>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                        <span style="font-size: 0.9rem; color: #666;">Notify me of new comments</span>
                        <label class="switch">
                            <input type="checkbox" id="notifPreferenceToggle" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            `;
            initNotificationPreference(noteId, token);
        }

        // --- Initialize Comment System ---
        initCommentSystem(noteId, token);

        // Show Highly Discussed badge if applicable
        if (note.is_highly_discussed) {
            document.getElementById('highlyDiscussedBadge').style.display = 'inline-block';
        }
        if (note.comment_count) {
            document.getElementById('commentCount').innerText = `(${note.comment_count})`;
        }

    } catch (err) {
        console.error('Error:', err);
        container.innerHTML = '<div class="error-message">Failed to load note details. Please try again.</div>';
    }
});

// --- Notification Preference Logic ---
async function initNotificationPreference(noteId, token) {
    const toggle = document.getElementById('notifPreferenceToggle');
    if (!toggle) return;

    // Optional: Fetch current preference if you want to be precise, 
    // but the schema defaults to TRUE.

    toggle.addEventListener('change', async () => {
        try {
            const response = await fetch(`/api/comments/notes/${noteId}/notification-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ receive_notifications: toggle.checked })
            });
            const data = await response.json();
            if (!response.ok) alert(data.message || "Failed to update preference");
        } catch (err) {
            console.error("Notif Pref Error:", err);
        }
    });
}

// --- Comment System Logic ---
async function initCommentSystem(noteId, token) {
    const commentList = document.getElementById('commentsList');
    const mainInput = document.getElementById('mainCommentInput');
    const postBtn = document.getElementById('btnPostComment');

    if (!postBtn) return;

    const fetchComments = async () => {
        try {
            const response = await fetch(`/api/comments/notes/${noteId}/comments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                renderComments(data.comments);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    const renderComments = (comments) => {
        const currentUser = JSON.parse(localStorage.getItem('user'));

        // Group comments by parent
        const mainComments = comments.filter(c => !c.parent_comment_id);
        const replies = comments.filter(c => c.parent_comment_id);

        commentList.innerHTML = mainComments.map(c => `
            <div class="comment-wrapper" id="comment-wrapper-${c.comment_id}">
                ${renderCommentCard(c, currentUser)}
                <div class="replies-container">
                    ${replies.filter(r => r.parent_comment_id === c.comment_id)
                .map(r => renderCommentCard(r, currentUser, true)).join('')}
                </div>
            </div>
        `).join('');

        // Attach listeners for actions
        attachCommentListeners(noteId, token, fetchComments);
    };

    const renderCommentCard = (c, currentUser, isReply = false) => {
        const timeAgo = formatTimeAgo(new Date(c.created_at));
        const isOwner = currentUser && currentUser.user_id === c.user_id;

        return `
            <div class="comment-card ${isReply ? 'reply' : ''}" id="comment-${c.comment_id}">
                <div class="comment-avatar">👤</div>
                <div class="comment-content">
                    <div class="comment-meta">
                        <span class="comment-user">${c.user_name}</span>
                        <span class="comment-time">${timeAgo}</span>
                        ${c.updated_at !== c.created_at ? '<span class="comment-time">(edited)</span>' : ''}
                    </div>
                    
                    <div class="comment-text" id="comment-text-${c.comment_id}">${c.content}</div>
                    
                    <!-- Edit container -->
                    <div class="edit-input-container" id="edit-container-${c.comment_id}">
                        <textarea id="edit-input-${c.comment_id}">${c.content}</textarea>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button class="action-link" onclick="cancelEdit(${c.comment_id})">Cancel</button>
                            <button class="btn-post-comment" style="padding: 6px 15px; font-size: 0.8rem;" onclick="saveEdit(${c.comment_id}, '${noteId}')">Save</button>
                        </div>
                    </div>

                    <div class="comment-actions">
                        <div class="vote-actions">
                            <button class="vote-btn ${c.user_vote === 1 ? 'active-up' : ''}" onclick="voteComment(${c.comment_id}, 1, '${noteId}')">
                                <i class="ri-arrow-up-s-line"></i>
                            </button>
                            <span class="comment-score">${c.score}</span>
                            <button class="vote-btn ${c.user_vote === -1 ? 'active-down' : ''}" onclick="voteComment(${c.comment_id}, -1, '${noteId}')">
                                <i class="ri-arrow-down-s-line"></i>
                            </button>
                        </div>
                        
                        ${!isReply ? `<a class="action-link" onclick="toggleReplyInput(${c.comment_id})"><i class="ri-reply-line"></i> Reply</a>` : ''}
                        
                        ${isOwner ? `
                            <a class="action-link" onclick="toggleEditInput(${c.comment_id})"><i class="ri-edit-line"></i> Edit</a>
                            <a class="action-link" onclick="deleteComment(${c.comment_id}, '${noteId}')" style="color: #e74c3c;"><i class="ri-delete-bin-line"></i> Delete</a>
                        ` : ''}
                    </div>

                    <!-- Reply input -->
                    <div class="reply-input-container" id="reply-container-${c.comment_id}">
                        <textarea id="reply-input-${c.comment_id}" placeholder="Write a reply..."></textarea>
                        <button class="btn-post-comment" style="padding: 8px 20px; font-size: 0.85rem;" onclick="postReply(${c.comment_id}, '${noteId}')">
                            Reply
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    postBtn.addEventListener('click', async () => {
        const content = mainInput.value.trim();
        if (!content) return;

        console.log("Posting comment to note:", noteId);
        postBtn.disabled = true;
        try {
            const response = await fetch(`/api/comments/notes/${noteId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            const result = await response.json();
            console.log("Post response:", result);

            if (response.ok) {
                mainInput.value = '';
                await fetchComments();
            } else {
                alert(result.message || "Failed to post comment");
            }
        } catch (err) {
            console.error("Post Comment Error:", err);
            alert("Error: " + err.message + "\nCheck console for details.");
        } finally {
            postBtn.disabled = false;
        }
    });

    // Initial fetch
    await fetchComments();
}

// --- Global Comment Functions ---

function toggleReplyInput(commentId) {
    const container = document.getElementById(`reply-container-${commentId}`);
    container.style.display = container.style.display === 'flex' ? 'none' : 'flex';
    if (container.style.display === 'flex') {
        container.querySelector('textarea').focus();
    }
}

async function postReply(parentCommentId, noteId) {
    console.log("Posting reply to comment:", parentCommentId, "on note:", noteId);
    const token = localStorage.getItem('token');
    const input = document.getElementById(`reply-input-${parentCommentId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
        const response = await fetch(`/api/comments/notes/${noteId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content, parent_comment_id: parentCommentId })
        });

        const result = await response.json();
        console.log("Reply response:", result);

        if (response.ok) {
            window.location.reload();
        } else {
            alert(result.message || "Failed to post reply");
        }
    } catch (err) {
        console.error("Reply error:", err);
        alert("Error connecting to server.");
    }
}

async function voteComment(commentId, voteType, noteId) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`/api/comments/comments/${commentId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ vote_type: voteType })
        });
        window.location.reload();
    } catch (err) {
        console.error("Vote error:", err);
    }
}

function toggleEditInput(commentId) {
    document.getElementById(`comment-text-${commentId}`).style.display = 'none';
    document.getElementById(`edit-container-${commentId}`).style.display = 'flex';
}

function cancelEdit(commentId) {
    document.getElementById(`comment-text-${commentId}`).style.display = 'block';
    document.getElementById(`edit-container-${commentId}`).style.display = 'none';
}

async function saveEdit(commentId, noteId) {
    const token = localStorage.getItem('token');
    const content = document.getElementById(`edit-input-${commentId}`).value.trim();
    if (!content) return;

    try {
        const response = await fetch(`/api/comments/comments/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });
        if (response.ok) window.location.reload();
    } catch (err) {
        console.error("Edit error:", err);
    }
}

async function deleteComment(commentId, noteId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/comments/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) window.location.reload();
    } catch (err) {
        console.error("Delete error:", err);
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

function attachCommentListeners(noteId, token, fetchComments) {
    // Handled by inline onclicks for simplicity in this legacy JS environment 
    // or we could use event delegation. Inline onclicks are easier to inject via innerHTML.
}



async function fetchVersionHistory(noteId, token) {
    try {
        const response = await fetch(`/api/notes/${noteId}/versions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.success && data.versions.length > 0) {
            const section = document.getElementById('version-history-section');
            const list = document.getElementById('version-list');

            section.style.display = 'block';
            list.innerHTML = data.versions.map(v => {
                const date = new Date(v.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                });
                return `
                    <div class="version-item">
                        <div class="version-info">
                            <span class="version-num">Version ${v.version_number}</span>
                            <span class="version-date">${date}</span>
                            ${v.changes_description ? `<div class="version-desc">${v.changes_description}</div>` : ''}
                        </div>
                        <a href="${v.file_path}" target="_blank" style="color: var(--coco-gold); font-size: 1.2rem;">
                            <i class="ri-file-download-line"></i>
                        </a>
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error("Error fetching version history:", err);
    }
}

function attachDetailsEventListeners(noteId, initialUserRating, noteData) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Stars
    const starContainer = document.getElementById('starRating');
    const stars = starContainer?.querySelectorAll('i');

    if (stars) {
        const updateStars = (rating) => {
            stars.forEach(s => {
                const val = parseInt(s.getAttribute('data-value'));
                if (val <= rating) {
                    s.classList.remove('ri-star-line');
                    s.classList.add('ri-star-fill', 'active');
                } else {
                    s.classList.remove('ri-star-fill', 'active');
                    s.classList.add('ri-star-line');
                }
            });
        };

        if (initialUserRating) {
            updateStars(initialUserRating);
        }

        stars.forEach(star => {
            star.addEventListener('click', async () => {
                const rating = parseInt(star.getAttribute('data-value'));

                try {
                    const response = await fetch(`/api/notes/${noteId}/rating`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ rating })
                    });

                    const data = await response.json();
                    if (response.ok && data.success) {
                        updateStars(rating);
                        const status = document.getElementById('ratingStatus');
                        if (status) status.innerText = `Your rating: ${rating}`;
                    } else {
                        alert(data.message || 'Error submitting rating');
                    }
                } catch (err) {
                    console.error('Rating Error:', err);
                    alert('Failed to submit rating');
                }
            });

            star.addEventListener('mouseenter', () => {
                const val = parseInt(star.getAttribute('data-value'));
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= val) {
                        s.style.color = 'var(--coco-gold)';
                    }
                });
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    s.style.color = '';
                });
            });
        });
    }

    // Upvote button
    const upvoteBtn = document.querySelector('.btn-upvote-details');
    if (upvoteBtn) {
        const countSpan = upvoteBtn.querySelector('.upvote-count');
        if (countSpan) {
            countSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                showUpvotersModal(noteId, token);
            });
        }

        upvoteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
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
            const fileLink = downloadBtn.getAttribute('href');

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
                    const downloadCountSpan = document.querySelector('.stat-pill span:last-child');
                    if (downloadCountSpan) {
                        const currentDownloads = parseInt(downloadCountSpan.innerText);
                        downloadCountSpan.innerText = currentDownloads + 1;
                    }
                    if (fileLink) window.open(fileLink, '_blank');
                } else {
                    alert(data.message || 'Error tracking download');
                }
            } catch (err) {
                console.error('Download Error:', err);
                if (fileLink) window.open(fileLink, '_blank');
            }
        });
    }

    // Edit Note Logic
    const openEditBtn = document.getElementById('openEditModal');
    const closeEditBtn = document.getElementById('closeEditModal');
    const editModal = document.getElementById('editNoteModal');
    const editForm = document.getElementById('edit-note-form');
    const editPdfInput = document.getElementById('edit-pdfFile');
    const versionChangesGroup = document.getElementById('versionChangesGroup');

    if (openEditBtn) {
        openEditBtn.addEventListener('click', () => {
            document.getElementById('edit-title').value = noteData.title;
            document.getElementById('edit-description').value = noteData.description || '';
            editModal.classList.add('active');
        });
    }

    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
    }

    if (editPdfInput) {
        editPdfInput.addEventListener('change', () => {
            if (editPdfInput.files.length > 0) {
                versionChangesGroup.style.display = 'block';
            } else {
                versionChangesGroup.style.display = 'none';
            }
        });
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = editForm.querySelector('.btn-save-edit');
            saveBtn.disabled = true;
            saveBtn.innerText = "Saving...";

            const formData = new FormData();
            formData.append('title', document.getElementById('edit-title').value);
            formData.append('description', document.getElementById('edit-description').value);
            if (editPdfInput.files[0]) {
                formData.append('pdfFile', editPdfInput.files[0]);
                formData.append('changes_description', document.getElementById('edit-changes').value);
            }

            try {
                const response = await fetch(`/api/notes/${noteId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                let result;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    console.error("Server returned non-JSON response:", text);
                    throw new Error(`Server returned ${response.status} ${response.statusText}. Check console for details.`);
                }

                if (response.ok && result.success) {
                    alert(result.message);
                    window.location.reload();
                } else {
                    alert(result.message || "Failed to update note");
                    saveBtn.disabled = false;
                    saveBtn.innerText = "Save Changes";
                }
            } catch (err) {
                console.error("Update Error:", err);
                alert("An error occurred while saving changes: " + err.message);
                saveBtn.disabled = false;
                saveBtn.innerText = "Save Changes";
            }
        });
    }
}

// Functions for upvoters modal
function closeUpvotersModal() {
    document.getElementById('upvotersModal').classList.remove('active');
}

function closeUpvotersModalOnBackdrop(event) {
    if (event.target.id === 'upvotersModal') {
        closeUpvotersModal();
    }
}

async function showUpvotersModal(noteId, token) {
    try {
        const response = await fetch(`/api/notes/${noteId}/upvoters`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            alert('You can only view upvoters for your own notes');
            return;
        }

        const upvoters = await response.json();
        const upvotersList = document.getElementById('upvotersList');

        if (upvoters.length === 0) {
            upvotersList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <p>No one has upvoted this note yet.</p>
                </div>
            `;
        } else {
            upvotersList.innerHTML = upvoters.map(user => `
                <div class="upvoter-item" onclick="navigateToUserProfile(${user.user_id})">
                    <div class="upvoter-info">
                        <div class="upvoter-name">${user.name}</div>
                        <div class="upvoter-stats">
                            <span><i class="ri-file-text-line"></i> ${user.notes_uploaded} Notes</span>
                            <span><i class="ri-download-line"></i> ${user.total_downloads} Downloads</span>
                            <span><i class="ri-thumb-up-line"></i> ${user.total_upvotes} Upvotes</span>
                        </div>
                    </div>
                    <div class="upvoter-avatar">👤</div>
                </div>
            `).join('');
        }

        document.getElementById('upvotersModal').classList.add('active');
    } catch (err) {
        console.error('Error fetching upvoters:', err);
        alert('Failed to load upvoters');
    }
}

function navigateToUserProfile(userId) {
    window.location.href = `user-profile.html?id=${userId}`;
}