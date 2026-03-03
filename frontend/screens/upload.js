document.addEventListener('DOMContentLoaded', async () => {
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('pdfFile');
    const dropZone = document.getElementById('drop-zone');
    const fileListDiv = document.getElementById('file-list');
    const token = localStorage.getItem('token');

    // 1. Check Authentication
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Fetch Dropdown Options from Backend
    async function loadOptions() {
        try {
            const response = await fetch('/api/notes/options', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                const deptSelect = document.getElementById('department_id');
                const courseSelect = document.getElementById('course_id');
                const catSelect = document.getElementById('category_id');

                // Populate Departments
                data.departments.forEach(dept => {
                    deptSelect.innerHTML += `<option value="${dept.department_id}">${dept.name}</option>`;
                });

                // Populate Courses
                data.courses.forEach(course => {
                    courseSelect.innerHTML += `<option value="${course.course_id}">${course.code} - ${course.name}</option>`;
                });

                // Populate Categories
                data.categories.forEach(cat => {
                    catSelect.innerHTML += `<option value="${cat.category_id}">${cat.name}</option>`;
                });
            }
        } catch (err) {
            console.error("Failed to load form options:", err);
        }
    }

    loadOptions();

    // 3. File Selection UI Logic
    dropZone.addEventListener('click', (e) => {
        // If clicking the remove button, don't trigger file browse
        if (e.target.classList.contains('remove-file-btn')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileListDiv.innerHTML = `
                <div class="file-item">
                    <span>📄 ${fileName}</span>
                    <button type="button" class="remove-file-btn" id="remove-file-btn">×</button>
                </div>
            `;

            // Add listener to remove button
            document.getElementById('remove-file-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Stop bubbling to dropZone
                fileInput.value = ''; // Clear file input
                fileListDiv.innerHTML = ''; // Clear preview
            });
        }
    });

    // 4. Handle Form Submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!fileInput.files[0]) {
            if (typeof showToast === 'function') {
                showToast("Please select a PDF file first.");
            } else {
                alert("Please select a PDF file first.");
            }
            return;
        }

        // Use FormData to send both text fields and the PDF file
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('batch', document.getElementById('batch').value);
        formData.append('course_id', document.getElementById('course_id').value);
        formData.append('department_id', document.getElementById('department_id').value);
        formData.append('category_id', document.getElementById('category_id').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('pdfFile', fileInput.files[0]);

        try {
            const response = await fetch('/api/notes/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                const successMessage = result.message || "Note uploaded successfully! 🥥";
                if (typeof showToast === 'function') {
                    showToast(successMessage);
                } else {
                    alert(successMessage);
                }

                const delay = result.warning ? 3000 : 1500;
                setTimeout(() => {
                    window.location.href = 'feed.html';
                }, delay);

            } else {
                const errorMessage = result.message || "Unknown error";
                if (typeof showToast === 'function') {
                    showToast("Upload failed: " + errorMessage);
                } else {
                    alert("⚠️ Error: " + errorMessage);
                }
            }
        } catch (err) {
            console.error("Submission Error:", err);
            if (typeof showToast === 'function') {
                showToast("Could not connect to the server.");
            } else {
                alert("Could not connect to the server.");
            }
        }
    });
});