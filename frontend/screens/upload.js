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

                // Populate Courses (FIXED LINE BELOW)
                data.courses.forEach(course => {
                    // Was: value="${course_id}" -> caused the error
                    // Now: value="${course.course_id}"
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
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileListDiv.innerHTML = `<div class="file-item">📄 ${fileName}</div>`;
        }
    });

    // 4. Handle Form Submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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

                // Wait longer if flagged to let users read the warning
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
                console.log(result);
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