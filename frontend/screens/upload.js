document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('uploadForm');
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const noteData = {
                title: document.getElementById('title').value,
                code: document.getElementById('code').value,
                dept: document.getElementById('dept').value,
                batch: document.getElementById('batch').value,
                cat: document.getElementById('category').value,
                description: document.getElementById('description').value,
                uploader: MockDB.currentUser.name
            };

            CocoAPI.addNote(noteData);
            alert("Success! Note content converted to Binary and stored in MockDB. 🥥");
            window.location.href = 'dashboard.html';
        });
    }
});