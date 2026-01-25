const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', async () => {
    const deptSelect = document.getElementById('department');
    const registerForm = document.getElementById('registerForm');
    const messageBox = document.getElementById('message');

    // --- 1. Load Departments Automatically ---
    // This fetches the list (CSE, ME, EEE) from your database
    if (deptSelect) {
        try {
            const res = await fetch(`${API_URL}/departments`);
            const departments = await res.json();

            // Clear "Loading..." text
            deptSelect.innerHTML = '<option value="" disabled selected>Select Department</option>';

            // Add options from database
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.department_id;
                option.textContent = dept.name;
                deptSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Failed to load departments", err);
            deptSelect.innerHTML = '<option disabled>Error loading options</option>';
        }
    }

    // --- 2. Handle Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Collect all data
            const emailInput = document.getElementById('email');
            const emailError = document.getElementById('email-error');
            const email = emailInput.value;

            // Reset Field Errors
            emailInput.classList.remove('error-border');
            emailError.style.display = 'none';

            const formData = {
                name: document.getElementById('name').value,
                student_id: document.getElementById('student_id').value,
                department_id: document.getElementById('department').value,
                batch: document.getElementById('batch').value,
                email: email,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            // Step 0: Client-side Domain Check
            if (!email.endsWith('@iut-dhaka.edu')) {
                emailInput.classList.add('error-border');
                emailError.style.display = 'block';
                return;
            }

            // Show Loading State
            messageBox.style.display = 'block';
            messageBox.style.color = 'blue';
            messageBox.textContent = 'Creating account...';

            try {
                // Send data to Backend
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Success!
                    messageBox.style.color = 'green';
                    messageBox.textContent = '✅ Success! Redirecting to login...';

                    // Wait 2 seconds then go to Login page
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // Error from server (e.g. "Email already exists")
                    messageBox.style.color = 'red';
                    messageBox.textContent = `❌ ${data.message}`;
                }
            } catch (error) {
                messageBox.style.color = 'red';
                messageBox.textContent = '❌ Server Error. Is the backend running?';
            }
        });
    }
});